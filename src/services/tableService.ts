/**
 * TableService - Atomic Transaction-Safe Table Management
 * 
 * This service implements Firestore transactions to eliminate race conditions
 * in table status management, ensuring ACID compliance for:
 * - Table status transitions with state validation
 * - Concurrent waiter/staff operations
 * - Table locking/unlocking with order association
 */

import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    runTransaction,
    serverTimestamp,
    Transaction,
    query,
    where
} from 'firebase/firestore';
import { Table, WaiterCall } from '../types/models';
import {
    TransactionResult,
    TransactionError,
    TransactionErrorCode,
    TableStatus,
    TableTransition,
    UpdateTableStatusInput,
    UpdateTableStatusResult,
    VALID_TABLE_TRANSITIONS
} from '../types/transactions';

// ==================================
// HELPER FUNCTIONS
// ==================================

/**
 * Create a transaction error object
 */
const createTransactionError = (
    code: TransactionErrorCode,
    message: string,
    details?: Record<string, any>,
    retryable: boolean = false
): TransactionError => ({
    code,
    message,
    details,
    retryable
});

/**
 * Generate a unique transaction ID for logging/tracking
 */
const generateTransactionId = (): string => {
    return `txn_table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate if a table status transition is allowed
 */
const isValidTransition = (from: TableStatus, to: TableStatus): TableTransition => {
    const validTargets = VALID_TABLE_TRANSITIONS[from] || [];
    const isValid = validTargets.includes(to);

    return {
        from,
        to,
        isValid,
        reason: isValid
            ? undefined
            : `Cannot transition table from '${from}' to '${to}'. Valid transitions from '${from}': ${validTargets.join(', ') || 'none'}`
    };
};

// ==================================
// ATOMIC TABLE STATUS UPDATE
// ==================================

/**
 * Update table status atomically with state transition validation
 * 
 * This function uses Firestore transactions to:
 * 1. Read current table state
 * 2. Validate the state transition is allowed
 * 3. Update table status atomically
 * 
 * Prevents race conditions where multiple waiters try to update the same table
 */
export const updateTableStatusAtomic = async (
    input: UpdateTableStatusInput
): Promise<TransactionResult<UpdateTableStatusResult>> => {
    const transactionId = generateTransactionId();
    console.log(`[TableService] Atomic status update: ${transactionId}, table: ${input.tableId}`);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            // ========================================
            // STEP 1: ATOMIC READ
            // ========================================

            const tableRef = doc(db, 'tables', input.tableId);
            const tableSnap = await transaction.get(tableRef);

            if (!tableSnap.exists()) {
                throw createTransactionError(
                    'INVALID_TABLE',
                    'Table not found',
                    { tableId: input.tableId },
                    false
                );
            }

            const tableData = tableSnap.data() as Table;
            const currentStatus = tableData.status;

            // ========================================
            // STEP 2: VALIDATE STATE TRANSITION
            // ========================================

            const transition = isValidTransition(currentStatus, input.newStatus);

            if (!transition.isValid) {
                throw createTransactionError(
                    'INVALID_STATE_TRANSITION',
                    transition.reason || 'Invalid state transition',
                    {
                        tableId: input.tableId,
                        currentStatus,
                        requestedStatus: input.newStatus
                    },
                    false
                );
            }

            // ========================================
            // STEP 3: ATOMIC WRITE
            // ========================================

            const updateData: Partial<Table> = {
                status: input.newStatus
            };

            // Handle lock state based on new status
            if (input.isLocked !== undefined) {
                updateData.isLocked = input.isLocked;
            } else {
                // Auto-determine lock state based on status
                updateData.isLocked = input.newStatus === 'occupied';
            }

            // Handle order association
            if (input.orderId !== undefined) {
                updateData.currentOrderId = input.orderId;
            } else if (input.newStatus === 'available') {
                // Clear order when becoming available
                updateData.currentOrderId = undefined;
            }

            transaction.update(tableRef, updateData as any);

            console.log(`[TableService] Transaction ${transactionId} committed: ${currentStatus} -> ${input.newStatus}`);

            return {
                tableId: input.tableId,
                previousStatus: currentStatus,
                newStatus: input.newStatus,
                previouslyLocked: tableData.isLocked,
                nowLocked: updateData.isLocked ?? tableData.isLocked,
                table: { id: input.tableId, ...tableData, ...updateData } as Table
            };
        });

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error(`[TableService] Transaction ${transactionId} failed:`, error);

        // Handle Firestore transaction-specific errors
        if (error.code === 'aborted' || error.code === 'failed-precondition') {
            return {
                success: false,
                error: createTransactionError(
                    'CONCURRENT_MODIFICATION',
                    'Table was modified by another user. Please refresh and try again.',
                    { originalError: error.message },
                    true
                )
            };
        }

        // Handle our custom transaction errors
        if (error.code && error.message && 'retryable' in error) {
            return {
                success: false,
                error: error as TransactionError
            };
        }

        // Handle unexpected errors
        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'An unexpected error occurred',
                { originalError: error },
                false
            )
        };
    }
};

// ==================================
// ATOMIC TABLE LOCK/UNLOCK
// ==================================

/**
 * Lock a table atomically (for order association)
 * 
 * Prevents race conditions where two customers try to order at the same table
 */
export const lockTableAtomic = async (
    tableId: string,
    orderId: string
): Promise<TransactionResult<Table>> => {
    const transactionId = generateTransactionId();
    console.log(`[TableService] Locking table: ${transactionId}, table: ${tableId}, order: ${orderId}`);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            const tableRef = doc(db, 'tables', tableId);
            const tableSnap = await transaction.get(tableRef);

            if (!tableSnap.exists()) {
                throw createTransactionError(
                    'INVALID_TABLE',
                    'Table not found',
                    { tableId },
                    false
                );
            }

            const tableData = tableSnap.data() as Table;

            // Check if already locked by another order
            if (tableData.isLocked && tableData.currentOrderId !== orderId) {
                throw createTransactionError(
                    'TABLE_LOCKED',
                    'Table is already in use by another order',
                    {
                        tableId,
                        existingOrderId: tableData.currentOrderId
                    },
                    true // Retryable after the other order completes
                );
            }

            // Lock the table
            transaction.update(tableRef, {
                isLocked: true,
                currentOrderId: orderId,
                status: 'occupied'
            });

            return {
                id: tableId,
                ...tableData,
                isLocked: true,
                currentOrderId: orderId,
                status: 'occupied' as const
            } as Table;
        });

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error(`[TableService] Lock failed:`, error);

        if (error.code && error.message && 'retryable' in error) {
            return { success: false, error: error as TransactionError };
        }

        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to lock table',
                { originalError: error },
                false
            )
        };
    }
};

/**
 * Unlock a table atomically
 * 
 * Only the order that locked the table can unlock it
 */
export const unlockTableAtomic = async (
    tableId: string,
    orderId: string
): Promise<TransactionResult<Table>> => {
    const transactionId = generateTransactionId();
    console.log(`[TableService] Unlocking table: ${transactionId}, table: ${tableId}`);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            const tableRef = doc(db, 'tables', tableId);
            const tableSnap = await transaction.get(tableRef);

            if (!tableSnap.exists()) {
                throw createTransactionError(
                    'INVALID_TABLE',
                    'Table not found',
                    { tableId },
                    false
                );
            }

            const tableData = tableSnap.data() as Table;

            // Verify the order owns the lock
            if (tableData.currentOrderId && tableData.currentOrderId !== orderId) {
                throw createTransactionError(
                    'VALIDATION_ERROR',
                    'Cannot unlock table: locked by a different order',
                    {
                        tableId,
                        requestedOrderId: orderId,
                        actualOrderId: tableData.currentOrderId
                    },
                    false
                );
            }

            // Unlock the table
            transaction.update(tableRef, {
                isLocked: false,
                currentOrderId: null,
                status: 'available'
            });

            return {
                id: tableId,
                ...tableData,
                isLocked: false,
                currentOrderId: undefined,
                status: 'available' as const
            } as Table;
        });

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error(`[TableService] Unlock failed:`, error);

        if (error.code && error.message && 'retryable' in error) {
            return { success: false, error: error as TransactionError };
        }

        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to unlock table',
                { originalError: error },
                false
            )
        };
    }
};

// ==================================
// ATOMIC WAITER CALL WITH TABLE VALIDATION
// ==================================

/**
 * Create a waiter call atomically with table validation
 * 
 * Validates table exists and belongs to restaurant before creating call
 */
export const createWaiterCallAtomic = async (
    restaurantId: string,
    tableId: string,
    tableNumber: string,
    type: WaiterCall['type']
): Promise<TransactionResult<{ callId: string; call: WaiterCall }>> => {
    const transactionId = generateTransactionId();
    console.log(`[TableService] Creating waiter call: ${transactionId}`);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            // Validate table
            const tableRef = doc(db, 'tables', tableId);
            const tableSnap = await transaction.get(tableRef);

            if (!tableSnap.exists()) {
                throw createTransactionError(
                    'INVALID_TABLE',
                    'Table not found',
                    { tableId },
                    false
                );
            }

            const tableData = tableSnap.data() as Table;

            if (tableData.restaurantId !== restaurantId) {
                throw createTransactionError(
                    'INVALID_RESTAURANT',
                    'Table does not belong to this restaurant',
                    { tableId, restaurantId },
                    false
                );
            }

            // Create waiter call document
            const callRef = doc(collection(db, 'waiterCalls'));

            const callData: Omit<WaiterCall, 'id'> = {
                ownerId: tableData.ownerId,
                restaurantId,
                tableId,
                tableNumber,
                type,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            transaction.set(callRef, callData);

            return {
                callId: callRef.id,
                call: { id: callRef.id, ...callData } as WaiterCall
            };
        });

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error(`[TableService] Waiter call creation failed:`, error);

        if (error.code && error.message && 'retryable' in error) {
            return { success: false, error: error as TransactionError };
        }

        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to create waiter call',
                { originalError: error },
                false
            )
        };
    }
};

// ==================================
// BATCH TABLE OPERATIONS
// ==================================

/**
 * Reset all tables to available status (end of day operation)
 * 
 * Uses individual transactions per table for safety
 */
export const resetAllTablesAtomic = async (
    ownerId: string,
    restaurantId: string
): Promise<TransactionResult<{ resetCount: number; errors: string[] }>> => {
    const transactionId = generateTransactionId();
    console.log(`[TableService] Resetting all tables: ${transactionId}`);

    try {
        // First, get all tables (not in transaction, just for listing)
        const tablesQuery = query(
            collection(db, 'tables'),
            where('ownerId', '==', ownerId),
            where('restaurantId', '==', restaurantId)
        );

        const tablesSnap = await getDocs(tablesQuery);
        const tables = tablesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Table[];

        let resetCount = 0;
        const errors: string[] = [];

        // Reset each table individually
        for (const table of tables) {
            try {
                await runTransaction(db, async (transaction: Transaction) => {
                    const tableRef = doc(db, 'tables', table.id!);
                    transaction.update(tableRef, {
                        isLocked: false,
                        currentOrderId: null,
                        status: 'available'
                    });
                });
                resetCount++;
            } catch (error: any) {
                errors.push(`Table ${table.number}: ${error.message}`);
            }
        }

        return {
            success: errors.length === 0,
            data: { resetCount, errors }
        };

    } catch (error: any) {
        console.error(`[TableService] Reset all tables failed:`, error);

        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to reset tables',
                { originalError: error },
                false
            )
        };
    }
};

// ==================================
// TABLE AVAILABILITY CHECK
// ==================================

/**
 * Check if a table is available for ordering (atomic read)
 */
export const checkTableAvailability = async (
    tableId: string
): Promise<TransactionResult<{ available: boolean; table: Table }>> => {
    try {
        const tableRef = doc(db, 'tables', tableId);
        const tableSnap = await getDoc(tableRef);

        if (!tableSnap.exists()) {
            return {
                success: false,
                error: createTransactionError(
                    'INVALID_TABLE',
                    'Table not found',
                    { tableId },
                    false
                )
            };
        }

        const tableData = { id: tableSnap.id, ...tableSnap.data() } as Table;

        return {
            success: true,
            data: {
                available: !tableData.isLocked && tableData.status === 'available',
                table: tableData
            }
        };

    } catch (error: any) {
        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to check table availability',
                { originalError: error },
                false
            )
        };
    }
};

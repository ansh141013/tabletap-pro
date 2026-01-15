/**
 * OrderService - Atomic Transaction-Safe Order Processing
 * 
 * This service implements Firestore transactions to eliminate race conditions
 * in order processing, ensuring ACID compliance for:
 * - Order creation with table locking
 * - Inventory validation (when enabled)
 * - Price consistency checks
 * - Concurrent order handling
 */

import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    runTransaction,
    serverTimestamp,
    Transaction,
    DocumentReference,
    DocumentSnapshot
} from 'firebase/firestore';
import { Order, OrderItem, Table, MenuItem } from '../types/models';
import {
    TransactionResult,
    TransactionError,
    TransactionErrorCode,
    CreateOrderInput,
    CreateOrderResult,
    OrderValidation,
    OrderItemValidation,
    TransactionOptions,
    DEFAULT_TRANSACTION_OPTIONS,
    BatchOrderUpdateInput,
    BatchOrderUpdateResult
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
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ==================================
// ATOMIC ORDER CREATION
// ==================================

/**
 * Create an order atomically with table locking
 * 
 * This function uses Firestore transactions to:
 * 1. Validate table exists and belongs to restaurant
 * 2. Check table is not already locked (preventing race conditions)
 * 3. Validate all menu items are available (optional)
 * 4. Create order document
 * 5. Lock table and link to order
 * 
 * All operations are atomic - either all succeed or all fail
 */
export const createOrderAtomic = async (
    input: CreateOrderInput,
    options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
): Promise<TransactionResult<CreateOrderResult>> => {
    const transactionId = generateTransactionId();
    console.log(`[OrderService] Starting atomic order creation: ${transactionId}`);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            // ========================================
            // STEP 1: ATOMIC READS (Must happen first)
            // ========================================

            // Read table document
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

            // Validate table belongs to restaurant
            if (tableData.restaurantId !== input.restaurantId) {
                throw createTransactionError(
                    'INVALID_RESTAURANT',
                    'Table does not belong to this restaurant',
                    { tableId: input.tableId, restaurantId: input.restaurantId },
                    false
                );
            }

            // Check if table is already locked (race condition prevention)
            if (tableData.isLocked) {
                throw createTransactionError(
                    'TABLE_LOCKED',
                    'Table is currently in use. Please wait for the current order to complete.',
                    { tableId: input.tableId, currentOrderId: tableData.currentOrderId },
                    true // This is retryable after some time
                );
            }

            // ========================================
            // STEP 2: VALIDATE MENU ITEMS (Optional)
            // ========================================

            const validation = await validateOrderItems(
                transaction,
                input.items,
                input.restaurantId,
                options
            );

            if (!validation.isValid && !options.allowPartialFulfillment) {
                throw createTransactionError(
                    'VALIDATION_ERROR',
                    `Order validation failed: ${validation.errors.join(', ')}`,
                    { validation },
                    false
                );
            }

            // ========================================
            // STEP 3: ATOMIC WRITES (Create order + lock table)
            // ========================================

            // Create order document reference (we need the ID before writing)
            const orderRef = doc(collection(db, 'orders'));

            const orderData: Omit<Order, 'id'> = {
                ownerId: tableData.ownerId, // Inherit from table
                restaurantId: input.restaurantId,
                tableId: input.tableId,
                tableNumber: input.tableNumber,
                items: input.items,
                total: options.validatePrices ? validation.totalValidated : input.total,
                customerName: input.customerName,
                customerPhone: input.customerPhone,
                notes: input.notes,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Write order document
            transaction.set(orderRef, orderData);

            // Lock table and associate with order (atomic with order creation)
            transaction.update(tableRef, {
                isLocked: true,
                currentOrderId: orderRef.id,
                status: 'occupied'
            });

            console.log(`[OrderService] Transaction ${transactionId} committed successfully`);

            return {
                orderId: orderRef.id,
                order: { id: orderRef.id, ...orderData } as Order,
                tableUpdated: true,
                validation
            };
        });

        return {
            success: true,
            data: result
        };

    } catch (error: any) {
        console.error(`[OrderService] Transaction ${transactionId} failed:`, error);

        // Handle Firestore transaction-specific errors
        if (error.code === 'aborted' || error.code === 'failed-precondition') {
            return {
                success: false,
                error: createTransactionError(
                    'TRANSACTION_ABORTED',
                    'Transaction was aborted due to concurrent modification. Please try again.',
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

/**
 * Validate order items against current menu data
 */
const validateOrderItems = async (
    transaction: Transaction,
    items: OrderItem[],
    restaurantId: string,
    options: TransactionOptions
): Promise<OrderValidation> => {
    const validations: OrderItemValidation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalValidated = 0;
    let totalRequested = 0;

    for (const item of items) {
        totalRequested += item.price * item.quantity;

        // If price validation is disabled, skip menu item lookup
        if (!options.validatePrices && !options.checkInventory) {
            validations.push({
                itemId: item.itemId,
                name: item.name,
                isValid: true,
                requestedQuantity: item.quantity,
                currentPrice: item.price,
                requestedPrice: item.price,
                priceChanged: false
            });
            totalValidated += item.price * item.quantity;
            continue;
        }

        // Fetch menu item to validate
        const menuItemRef = doc(db, 'menuItems', item.itemId);
        const menuItemSnap = await transaction.get(menuItemRef);

        if (!menuItemSnap.exists()) {
            validations.push({
                itemId: item.itemId,
                name: item.name,
                isValid: false,
                requestedQuantity: item.quantity,
                currentPrice: 0,
                requestedPrice: item.price,
                priceChanged: true,
                errorMessage: 'Menu item no longer exists'
            });
            errors.push(`Menu item "${item.name}" is no longer available`);
            continue;
        }

        const menuItemData = menuItemSnap.data() as MenuItem;

        // Validate item belongs to restaurant
        if (menuItemData.restaurantId !== restaurantId) {
            validations.push({
                itemId: item.itemId,
                name: item.name,
                isValid: false,
                requestedQuantity: item.quantity,
                currentPrice: menuItemData.price,
                requestedPrice: item.price,
                priceChanged: false,
                errorMessage: 'Menu item does not belong to this restaurant'
            });
            errors.push(`Menu item "${item.name}" is invalid`);
            continue;
        }

        // Check availability
        if (!menuItemData.available) {
            validations.push({
                itemId: item.itemId,
                name: item.name,
                isValid: false,
                requestedQuantity: item.quantity,
                currentPrice: menuItemData.price,
                requestedPrice: item.price,
                priceChanged: false,
                errorMessage: 'Item is currently unavailable'
            });
            errors.push(`"${item.name}" is currently unavailable`);
            continue;
        }

        // Check for price changes
        const priceChanged = menuItemData.price !== item.price;
        if (priceChanged) {
            warnings.push(
                `Price for "${item.name}" changed from ${item.price} to ${menuItemData.price}`
            );
        }

        validations.push({
            itemId: item.itemId,
            name: item.name,
            isValid: true,
            requestedQuantity: item.quantity,
            currentPrice: menuItemData.price,
            requestedPrice: item.price,
            priceChanged
        });

        // Use current price for total
        totalValidated += menuItemData.price * item.quantity;
    }

    return {
        isValid: errors.length === 0,
        items: validations,
        totalValidated,
        totalRequested,
        errors,
        warnings
    };
};

// ==================================
// ATOMIC ORDER STATUS UPDATE
// ==================================

/**
 * Update order status atomically with table unlock
 * 
 * When order is paid/cancelled, this atomically:
 * 1. Updates order status
 * 2. Unlocks the associated table
 * 3. Clears table's currentOrderId
 */
export const updateOrderStatusAtomic = async (
    orderId: string,
    newStatus: Order['status'],
    tableId?: string
): Promise<TransactionResult<{ orderId: string; status: Order['status'] }>> => {
    const transactionId = generateTransactionId();
    console.log(`[OrderService] Atomic status update: ${transactionId}, order: ${orderId}, status: ${newStatus}`);

    try {
        await runTransaction(db, async (transaction: Transaction) => {
            // Read order to validate it exists
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await transaction.get(orderRef);

            if (!orderSnap.exists()) {
                throw createTransactionError(
                    'VALIDATION_ERROR',
                    'Order not found',
                    { orderId },
                    false
                );
            }

            const orderData = orderSnap.data() as Order;
            const effectiveTableId = tableId || orderData.tableId;

            // Update order status
            transaction.update(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // If order is complete, unlock table atomically
            const shouldUnlockTable = ['paid', 'cancelled', 'auto_cancelled'].includes(newStatus);

            if (shouldUnlockTable && effectiveTableId) {
                const tableRef = doc(db, 'tables', effectiveTableId);
                const tableSnap = await transaction.get(tableRef);

                if (tableSnap.exists()) {
                    const tableData = tableSnap.data() as Table;

                    // Only unlock if this order owns the table lock
                    if (tableData.currentOrderId === orderId) {
                        transaction.update(tableRef, {
                            isLocked: false,
                            currentOrderId: null,
                            status: 'available'
                        });
                    }
                }
            }
        });

        return {
            success: true,
            data: { orderId, status: newStatus }
        };

    } catch (error: any) {
        console.error(`[OrderService] Status update failed:`, error);

        if (error.code && error.message && 'retryable' in error) {
            return { success: false, error: error as TransactionError };
        }

        return {
            success: false,
            error: createTransactionError(
                'TRANSACTION_FAILED',
                error.message || 'Failed to update order status',
                { originalError: error },
                false
            )
        };
    }
};

// ==================================
// BATCH ORDER OPERATIONS
// ==================================

/**
 * Update multiple orders atomically
 * Uses individual transactions per order (Firestore batch has 500 doc limit)
 */
export const batchUpdateOrderStatus = async (
    input: BatchOrderUpdateInput
): Promise<BatchOrderUpdateResult> => {
    const results: BatchOrderUpdateResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const orderId of input.orderIds) {
        const result = await updateOrderStatusAtomic(
            orderId,
            input.status,
            input.unlockTables ? undefined : undefined // Will use order's tableId
        );

        if (result.success) {
            successCount++;
            results.push({ orderId, success: true });
        } else {
            failureCount++;
            results.push({
                orderId,
                success: false,
                error: result.error?.message
            });
        }
    }

    return {
        successCount,
        failureCount,
        results
    };
};

// ==================================
// RETRY WRAPPER
// ==================================

/**
 * Execute a transaction with automatic retry on contention
 */
export const executeWithRetry = async <T>(
    operation: () => Promise<TransactionResult<T>>,
    maxRetries: number = 3,
    delayMs: number = 100
): Promise<TransactionResult<T>> => {
    let lastResult: TransactionResult<T> | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        lastResult = await operation();

        if (lastResult.success) {
            return lastResult;
        }

        // Only retry if the error is retryable
        if (!lastResult.error?.retryable) {
            return lastResult;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        }
    }

    // Return last result with max retries error
    return {
        success: false,
        error: createTransactionError(
            'MAX_RETRIES_EXCEEDED',
            `Operation failed after ${maxRetries + 1} attempts`,
            { lastError: lastResult?.error },
            false
        )
    };
};

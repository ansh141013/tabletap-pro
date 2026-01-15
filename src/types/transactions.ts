// ==================================
// TRANSACTION TYPES & INTERFACES
// ==================================

import { Order, OrderItem, Table } from './models';

/**
 * Result of a transaction operation
 */
export interface TransactionResult<T = any> {
    success: boolean;
    data?: T;
    error?: TransactionError;
}

/**
 * Transaction error with detailed information
 */
export interface TransactionError {
    code: TransactionErrorCode;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
}

/**
 * Transaction error codes for proper error handling
 */
export type TransactionErrorCode =
    | 'ITEM_UNAVAILABLE'
    | 'INSUFFICIENT_STOCK'
    | 'TABLE_LOCKED'
    | 'TABLE_UNAVAILABLE'
    | 'INVALID_TABLE'
    | 'INVALID_RESTAURANT'
    | 'INVALID_STATE_TRANSITION'
    | 'TRANSACTION_ABORTED'
    | 'TRANSACTION_FAILED'
    | 'VALIDATION_ERROR'
    | 'CONCURRENT_MODIFICATION'
    | 'MAX_RETRIES_EXCEEDED';

// ==================================
// ORDER VALIDATION
// ==================================

/**
 * Validation result for order items
 */
export interface OrderItemValidation {
    itemId: string;
    name: string;
    isValid: boolean;
    requestedQuantity: number;
    availableQuantity?: number;
    currentPrice: number;
    requestedPrice: number;
    priceChanged: boolean;
    errorMessage?: string;
}

/**
 * Complete order validation result
 */
export interface OrderValidation {
    isValid: boolean;
    items: OrderItemValidation[];
    totalValidated: number;
    totalRequested: number;
    errors: string[];
    warnings: string[];
}

/**
 * Input for creating an order atomically
 */
export interface CreateOrderInput {
    restaurantId: string;
    tableId: string;
    tableNumber: string;
    items: OrderItem[];
    total: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
}

/**
 * Result of atomic order creation
 */
export interface CreateOrderResult {
    orderId: string;
    order: Order;
    tableUpdated: boolean;
    validation: OrderValidation;
}

// ==================================
// TABLE STATE TRANSITIONS
// ==================================

/**
 * Valid table statuses
 */
export type TableStatus = 'available' | 'occupied' | 'reserved';

/**
 * Valid table state transitions
 */
export interface TableTransition {
    from: TableStatus;
    to: TableStatus;
    isValid: boolean;
    reason?: string;
}

/**
 * All valid table state transitions
 */
export const VALID_TABLE_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
    'available': ['occupied', 'reserved'],
    'occupied': ['available', 'reserved'],
    'reserved': ['available', 'occupied']
};

/**
 * Input for updating table status atomically
 */
export interface UpdateTableStatusInput {
    tableId: string;
    newStatus: TableStatus;
    orderId?: string;
    isLocked?: boolean;
}

/**
 * Result of atomic table status update
 */
export interface UpdateTableStatusResult {
    tableId: string;
    previousStatus: TableStatus;
    newStatus: TableStatus;
    previouslyLocked: boolean;
    nowLocked: boolean;
    table: Table;
}

// ==================================
// BATCH OPERATIONS
// ==================================

/**
 * Input for batch order status update
 */
export interface BatchOrderUpdateInput {
    orderIds: string[];
    status: Order['status'];
    unlockTables?: boolean;
}

/**
 * Result of batch order update
 */
export interface BatchOrderUpdateResult {
    successCount: number;
    failureCount: number;
    results: {
        orderId: string;
        success: boolean;
        error?: string;
    }[];
}

// ==================================
// INVENTORY TRACKING (Future)
// ==================================

/**
 * Inventory check result for a menu item
 */
export interface InventoryCheck {
    itemId: string;
    available: boolean;
    currentStock?: number;
    requestedQuantity: number;
    canFulfill: boolean;
}

/**
 * Inventory update operation
 */
export interface InventoryUpdate {
    itemId: string;
    quantityChange: number;
    operation: 'decrement' | 'increment' | 'set';
    newValue?: number;
}

// ==================================
// TRANSACTION CONTEXT
// ==================================

/**
 * Context passed through transaction operations
 */
export interface TransactionContext {
    transactionId: string;
    startTime: Date;
    retryCount: number;
    maxRetries: number;
    timeout: number;
}

/**
 * Options for transaction execution
 */
export interface TransactionOptions {
    maxRetries?: number;
    timeout?: number;
    validatePrices?: boolean;
    checkInventory?: boolean;
    allowPartialFulfillment?: boolean;
}

/**
 * Default transaction options
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
    maxRetries: 5,
    timeout: 30000,
    validatePrices: true,
    checkInventory: false,
    allowPartialFulfillment: false
};

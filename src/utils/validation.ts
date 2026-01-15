/**
 * Validation Schemas - Runtime Validation with Zod
 * 
 * TypeScript types are erased at compile time. Malicious clients can send
 * invalid data that passes TypeScript but corrupts the database.
 * 
 * These Zod schemas enforce business rules at runtime:
 * - Positive quantities and prices
 * - Valid status values
 * - Required field presence
 * - String length limits
 * - Pattern validation
 */

import { z } from 'zod';

// ========================================
// PRIMITIVE VALIDATORS
// ========================================

/**
 * Firebase document ID validator
 */
export const FirebaseIdSchema = z.string()
    .min(1, 'ID is required')
    .max(128, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

/**
 * Email validator
 */
export const EmailSchema = z.string()
    .email('Invalid email format')
    .max(255, 'Email too long');

/**
 * Phone number validator (flexible international format)
 */
export const PhoneSchema = z.string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number format')
    .optional();

/**
 * Currency code validator (ISO 4217)
 */
export const CurrencyCodeSchema = z.string()
    .length(3, 'Currency code must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Invalid currency code');

/**
 * Price validator (positive number with max 2 decimal places)
 */
export const PriceSchema = z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price too high')
    .refine(val => Math.round(val * 100) / 100 === val, 'Price can have maximum 2 decimal places');

/**
 * Quantity validator (positive integer)
 */
export const QuantitySchema = z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(100, 'Maximum quantity is 100');

// ========================================
// ORDER ITEM SCHEMA
// ========================================

export const OrderItemSchema = z.object({
    itemId: FirebaseIdSchema,
    name: z.string()
        .min(1, 'Item name is required')
        .max(200, 'Item name too long'),
    price: PriceSchema,
    quantity: QuantitySchema,
    note: z.string()
        .max(500, 'Note too long')
        .optional()
});

export type ValidatedOrderItem = z.infer<typeof OrderItemSchema>;

// ========================================
// ORDER SCHEMA
// ========================================

export const OrderStatusSchema = z.enum([
    'pending',
    'accepted',
    'preparing',
    'ready',
    'served',
    'paid',
    'cancelled',
    'auto_cancelled'
]);

export const CreateOrderSchema = z.object({
    restaurantId: FirebaseIdSchema,
    tableId: FirebaseIdSchema,
    tableNumber: z.string()
        .min(1, 'Table number is required')
        .max(20, 'Table number too long'),
    items: z.array(OrderItemSchema)
        .min(1, 'Order must have at least one item')
        .max(50, 'Maximum 50 items per order'),
    total: PriceSchema,
    customerName: z.string()
        .min(1, 'Customer name is required')
        .max(100, 'Customer name too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'Customer name contains invalid characters')
        .optional(),
    customerPhone: PhoneSchema,
    notes: z.string()
        .max(1000, 'Notes too long')
        .optional()
}).refine(data => {
    // Validate that total matches sum of items
    const calculatedTotal = data.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );
    // Allow small floating point differences (0.01)
    return Math.abs(calculatedTotal - data.total) < 0.02;
}, {
    message: 'Order total does not match sum of items',
    path: ['total']
});

export type ValidatedCreateOrder = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
    orderId: FirebaseIdSchema,
    status: OrderStatusSchema,
    tableId: FirebaseIdSchema.optional()
});

export type ValidatedOrderStatusUpdate = z.infer<typeof UpdateOrderStatusSchema>;

// ========================================
// MENU ITEM SCHEMA
// ========================================

export const CreateMenuItemSchema = z.object({
    restaurantId: FirebaseIdSchema,
    categoryId: FirebaseIdSchema,
    name: z.string()
        .min(1, 'Item name is required')
        .max(200, 'Item name too long')
        .regex(/^[a-zA-Z0-9\s'-.,&()]+$/, 'Item name contains invalid characters'),
    description: z.string()
        .max(1000, 'Description too long'),
    price: PriceSchema,
    imageUrl: z.string()
        .url('Invalid image URL')
        .max(2048, 'Image URL too long')
        .optional()
        .or(z.literal('')),
    available: z.boolean()
});

export type ValidatedCreateMenuItem = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial().extend({
    id: FirebaseIdSchema
});

export type ValidatedUpdateMenuItem = z.infer<typeof UpdateMenuItemSchema>;

// ========================================
// CATEGORY SCHEMA
// ========================================

export const CreateCategorySchema = z.object({
    restaurantId: FirebaseIdSchema,
    name: z.string()
        .min(1, 'Category name is required')
        .max(100, 'Category name too long'),
    description: z.string()
        .max(500, 'Description too long')
        .optional(),
    displayOrder: z.number()
        .int('Display order must be a whole number')
        .min(0, 'Display order cannot be negative')
        .max(1000, 'Display order too high')
});

export type ValidatedCreateCategory = z.infer<typeof CreateCategorySchema>;

// ========================================
// TABLE SCHEMA
// ========================================

export const TableStatusSchema = z.enum(['available', 'occupied', 'reserved']);

export const CreateTableSchema = z.object({
    restaurantId: FirebaseIdSchema,
    number: z.string()
        .min(1, 'Table number is required')
        .max(20, 'Table number too long'),
    seats: z.number()
        .int('Seats must be a whole number')
        .positive('Seats must be at least 1')
        .max(100, 'Maximum 100 seats per table')
});

export type ValidatedCreateTable = z.infer<typeof CreateTableSchema>;

export const UpdateTableStatusSchema = z.object({
    tableId: FirebaseIdSchema,
    status: TableStatusSchema,
    isLocked: z.boolean().optional(),
    orderId: FirebaseIdSchema.optional()
});

export type ValidatedUpdateTableStatus = z.infer<typeof UpdateTableStatusSchema>;

// ========================================
// WAITER CALL SCHEMA
// ========================================

export const WaiterCallTypeSchema = z.enum(['service', 'bill', 'other']);

export const CreateWaiterCallSchema = z.object({
    restaurantId: FirebaseIdSchema,
    tableId: FirebaseIdSchema,
    tableNumber: z.string()
        .min(1, 'Table number is required')
        .max(20, 'Table number too long'),
    type: WaiterCallTypeSchema
});

export type ValidatedCreateWaiterCall = z.infer<typeof CreateWaiterCallSchema>;

// ========================================
// USER SCHEMA
// ========================================

export const UserRoleSchema = z.enum(['owner', 'staff', 'admin']);

export const CreateUserProfileSchema = z.object({
    email: EmailSchema,
    displayName: z.string()
        .min(1, 'Display name is required')
        .max(100, 'Display name too long'),
    role: UserRoleSchema
});

export type ValidatedCreateUserProfile = z.infer<typeof CreateUserProfileSchema>;

// ========================================
// RESTAURANT SCHEMA
// ========================================

export const CreateRestaurantSchema = z.object({
    name: z.string()
        .min(1, 'Restaurant name is required')
        .max(200, 'Restaurant name too long'),
    description: z.string()
        .max(2000, 'Description too long')
        .optional(),
    address: z.string()
        .max(500, 'Address too long')
        .optional(),
    phone: PhoneSchema,
    cuisine: z.string()
        .max(100, 'Cuisine type too long')
        .optional(),
    currency: CurrencyCodeSchema,
    language: z.string()
        .min(2, 'Language code required')
        .max(10, 'Language code too long'),
    timezone: z.string()
        .min(1, 'Timezone required')
        .max(50, 'Timezone too long'),
    latitude: z.number()
        .min(-90, 'Invalid latitude')
        .max(90, 'Invalid latitude')
        .optional(),
    longitude: z.number()
        .min(-180, 'Invalid longitude')
        .max(180, 'Invalid longitude')
        .optional(),
    location_radius: z.number()
        .positive('Location radius must be positive')
        .max(10000, 'Location radius too large')
        .optional(),
    order_timeout: z.number()
        .int('Order timeout must be a whole number')
        .positive('Order timeout must be positive')
        .max(3600, 'Order timeout too long')
        .optional(),
    abuse_threshold: z.number()
        .int('Abuse threshold must be a whole number')
        .min(1, 'Abuse threshold too low')
        .max(100, 'Abuse threshold too high')
        .optional(),
    taxRate: z.number()
        .min(0, 'Tax rate cannot be negative')
        .max(100, 'Tax rate too high')
        .optional()
});

export type ValidatedCreateRestaurant = z.infer<typeof CreateRestaurantSchema>;

// ========================================
// VALIDATION HELPER FUNCTIONS
// ========================================

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
}

/**
 * Individual field validation error
 */
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}

/**
 * Validate data against a Zod schema with friendly error extraction
 */
export function validateWithSchema<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const validData = schema.parse(data);
        return {
            success: true,
            data: validData
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: ValidationError[] = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));
            return {
                success: false,
                errors
            };
        }

        // Unknown error type
        return {
            success: false,
            errors: [{
                field: 'unknown',
                message: 'Validation failed with unknown error'
            }]
        };
    }
}

/**
 * Validate and throw on failure (for use in services)
 */
export function validateOrThrow<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    errorPrefix: string = 'Validation failed'
): T {
    const result = validateWithSchema(schema, data);

    if (!result.success) {
        const errorMessages = result.errors?.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`${errorPrefix}: ${errorMessages}`);
    }

    return result.data!;
}

// ========================================
// PRE-BUILT VALIDATORS FOR COMMON USE CASES
// ========================================

export const validators = {
    createOrder: (data: unknown) => validateWithSchema(CreateOrderSchema, data),
    updateOrderStatus: (data: unknown) => validateWithSchema(UpdateOrderStatusSchema, data),
    createMenuItem: (data: unknown) => validateWithSchema(CreateMenuItemSchema, data),
    updateMenuItem: (data: unknown) => validateWithSchema(UpdateMenuItemSchema, data),
    createCategory: (data: unknown) => validateWithSchema(CreateCategorySchema, data),
    createTable: (data: unknown) => validateWithSchema(CreateTableSchema, data),
    updateTableStatus: (data: unknown) => validateWithSchema(UpdateTableStatusSchema, data),
    createWaiterCall: (data: unknown) => validateWithSchema(CreateWaiterCallSchema, data),
    createRestaurant: (data: unknown) => validateWithSchema(CreateRestaurantSchema, data),
    createUserProfile: (data: unknown) => validateWithSchema(CreateUserProfileSchema, data)
};

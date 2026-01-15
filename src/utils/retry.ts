/**
 * Retry Utility - Exponential Backoff with Error Classification
 * 
 * Wraps async operations with intelligent retry logic:
 * - Exponential backoff prevents thundering herd
 * - Error classification avoids retrying permanent failures
 * - User-friendly error messages and retry callbacks
 */

// ========================================
// ERROR CLASSIFICATION
// ========================================

/**
 * Firestore/Firebase error codes that are transient and should be retried
 */
const RETRYABLE_ERROR_CODES = new Set([
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'cancelled',
    'internal',
    'unknown'
]);

/**
 * Error codes that are permanent failures - do not retry
 */
const PERMANENT_ERROR_CODES = new Set([
    'permission-denied',
    'unauthenticated',
    'invalid-argument',
    'not-found',
    'already-exists',
    'failed-precondition',
    'out-of-range',
    'unimplemented',
    'data-loss'
]);

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
    // Check Firebase error code
    if (error?.code) {
        const code = error.code.replace('firestore/', '').replace('auth/', '');

        if (PERMANENT_ERROR_CODES.has(code)) {
            return false;
        }

        if (RETRYABLE_ERROR_CODES.has(code)) {
            return true;
        }
    }

    // Network errors are retryable
    if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
        return true;
    }

    // Timeout errors are retryable
    if (error?.message?.includes('timeout') || error?.message?.includes('TIMEOUT')) {
        return true;
    }

    // Default: don't retry unknown errors
    return false;
};

// ========================================
// RETRY CONFIGURATION
// ========================================

export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Initial delay in milliseconds */
    initialDelayMs: number;
    /** Maximum delay between retries */
    maxDelayMs: number;
    /** Multiplier for exponential backoff */
    backoffMultiplier: number;
    /** Optional callback for retry events */
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
    /** Optional callback for final failure */
    onFailure?: (error: Error, attempts: number) => void;
    /** Custom function to determine if error is retryable */
    isRetryable?: (error: any) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    isRetryable: isRetryableError
};

// ========================================
// RETRY RESULT TYPE
// ========================================

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDelayMs: number;
}

// ========================================
// EXPONENTIAL BACKOFF RETRY
// ========================================

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
    attempt: number,
    initialDelayMs: number,
    maxDelayMs: number,
    backoffMultiplier: number
): number => {
    // Exponential backoff
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

    // Add jitter (±25%) to prevent thundering herd
    const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);

    return Math.round(cappedDelay + jitter);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute an async operation with exponential backoff retry
 * 
 * @param operation - The async function to execute
 * @param config - Retry configuration
 * @returns RetryResult with success status, data or error, and metadata
 * 
 * @example
 * const result = await executeWithRetry(
 *   () => getDoc(docRef),
 *   { maxAttempts: 3, onRetry: (attempt) => toast.info(`Retrying... (${attempt})`) }
 * );
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> => {
    const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, onRetry, onFailure, isRetryable } = finalConfig;

    let lastError: Error | undefined;
    let totalDelayMs = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const data = await operation();
            return {
                success: true,
                data,
                attempts: attempt + 1,
                totalDelayMs
            };
        } catch (error: any) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = attempt < maxAttempts - 1 && (isRetryable?.(error) ?? isRetryableError(error));

            if (!shouldRetry) {
                break;
            }

            // Calculate delay
            const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier);
            totalDelayMs += delayMs;

            // Notify of retry
            onRetry?.(attempt + 1, error, delayMs);

            console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`, error.message);

            // Wait before retry
            await sleep(delayMs);
        }
    }

    // All attempts failed
    onFailure?.(lastError!, maxAttempts);

    return {
        success: false,
        error: lastError,
        attempts: maxAttempts,
        totalDelayMs
    };
};

/**
 * Execute operation with retry, throwing on final failure
 * Useful when you want to use try/catch instead of checking result
 */
export const executeWithRetryOrThrow = async <T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> => {
    const result = await executeWithRetry(operation, config);

    if (!result.success) {
        throw result.error;
    }

    return result.data!;
};

// ========================================
// SPECIALIZED RETRY HELPERS
// ========================================

/**
 * Retry configuration optimized for Firestore reads
 */
export const FIRESTORE_READ_RETRY_CONFIG: Partial<RetryConfig> = {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2
};

/**
 * Retry configuration optimized for Firestore writes
 * More conservative to prevent duplicate writes
 */
export const FIRESTORE_WRITE_RETRY_CONFIG: Partial<RetryConfig> = {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2
};

/**
 * Retry configuration for network operations (API calls)
 */
export const NETWORK_RETRY_CONFIG: Partial<RetryConfig> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
};

/**
 * Batch operation retry wrapper
 * Retries individual operations in a batch, returning partial success
 */
export const executeWithBatchRetry = async <T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    config: Partial<RetryConfig> = {}
): Promise<{
    successful: { item: T; result: R }[];
    failed: { item: T; error: Error }[];
}> => {
    const successful: { item: T; result: R }[] = [];
    const failed: { item: T; error: Error }[] = [];

    for (const item of items) {
        const result = await executeWithRetry(() => operation(item), config);

        if (result.success) {
            successful.push({ item, result: result.data! });
        } else {
            failed.push({ item, error: result.error! });
        }
    }

    return { successful, failed };
};

// ========================================
// ERROR FORMATTING
// ========================================

/**
 * Get user-friendly error message from Firebase error
 */
export const getUserFriendlyError = (error: any): string => {
    const code = error?.code?.replace('firestore/', '').replace('auth/', '') ?? '';

    const errorMessages: Record<string, string> = {
        'unavailable': 'Service temporarily unavailable. Please try again.',
        'deadline-exceeded': 'Request timed out. Please try again.',
        'resource-exhausted': 'Too many requests. Please wait a moment.',
        'permission-denied': 'You do not have permission to perform this action.',
        'unauthenticated': 'Please sign in to continue.',
        'invalid-argument': 'Invalid data provided. Please check your input.',
        'not-found': 'The requested item was not found.',
        'already-exists': 'This item already exists.',
        'network': 'Network connection lost. Please check your connection.',
        'cancelled': 'Operation was cancelled.',
        'aborted': 'Operation was aborted due to a conflict. Please try again.'
    };

    return errorMessages[code] ?? error?.message ?? 'An unexpected error occurred. Please try again.';
};

/**
 * Firestore Error Handler Utility
 * Provides user-friendly error messages for common Firestore errors
 */

export interface FirestoreErrorResult {
    userMessage: string;
    isIndexError: boolean;
    isPermissionError: boolean;
    isNetworkError: boolean;
    isSetupError: boolean;
}

/**
 * Handles Firestore errors and returns user-friendly messages
 * Logs the full error to console for developers
 */
export const handleFirestoreError = (error: any, context: string): FirestoreErrorResult => {
    const message = error?.message || error?.code || String(error);
    const code = error?.code || '';

    // Log full error for developers
    console.error(`[Firestore Error] ${context}:`, error);

    // Index-related errors (Setup required)
    if (message.includes('index') || code === 'failed-precondition') {
        return {
            userMessage: "We're optimizing your database. This may take a few minutes.",
            isIndexError: true,
            isPermissionError: false,
            isNetworkError: false,
            isSetupError: true
        };
    }

    // Permission errors
    if (code === 'permission-denied') {
        return {
            userMessage: "You don't have permission to access this data.",
            isIndexError: false,
            isPermissionError: true,
            isNetworkError: false,
            isSetupError: false
        };
    }

    // Network errors
    if (message.includes('network') || code === 'unavailable') {
        return {
            userMessage: "Network error. Please check your connection.",
            isIndexError: false,
            isPermissionError: false,
            isNetworkError: true,
            isSetupError: false
        };
    }

    // Not found
    if (code === 'not-found') {
        return {
            userMessage: "The requested data was not found.",
            isIndexError: false,
            isPermissionError: false,
            isNetworkError: false,
            isSetupError: false
        };
    }

    // Generic fallback
    return {
        userMessage: "Something went wrong. Please try again.",
        isIndexError: false,
        isPermissionError: false,
        isNetworkError: false,
        isSetupError: false
    };
};

/**
 * Simple version that just returns the user message string
 */
export const getFirestoreErrorMessage = (error: any, context: string): string => {
    return handleFirestoreError(error, context).userMessage;
};

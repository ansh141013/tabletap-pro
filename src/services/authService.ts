/**
 * Auth Service - Role-Based Access Control & Rate Limiting
 * 
 * This service provides:
 * - User role verification for UI rendering
 * - Client-side rate limiting (defense in depth, not primary security)
 * - Role-based permission checks
 * 
 * NOTE: These checks are for UI rendering only. Security is enforced
 * by Firestore security rules on the server side.
 */

import { auth, db } from "@/config/firebase";
import {
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "@/types/models";

const googleProvider = new GoogleAuthProvider();

// ========================================
// AUTHENTICATION
// ========================================

/**
 * Sign in with Google OAuth
 */
export const googleSignIn = async (): Promise<UserCredential> => {
    return await signInWithPopup(auth, googleProvider);
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
};

// ========================================
// USER ROLES & PERMISSIONS
// ========================================

/**
 * User role type
 */
export type UserRole = 'owner' | 'staff' | 'admin';

/**
 * Permission types for RBAC
 */
export type Permission =
    | 'menu:read'
    | 'menu:write'
    | 'orders:read'
    | 'orders:write'
    | 'orders:update_status'
    | 'tables:read'
    | 'tables:write'
    | 'restaurant:read'
    | 'restaurant:write'
    | 'staff:manage'
    | 'analytics:read';

/**
 * Role-Permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    owner: [
        'menu:read', 'menu:write',
        'orders:read', 'orders:write', 'orders:update_status',
        'tables:read', 'tables:write',
        'restaurant:read', 'restaurant:write',
        'staff:manage',
        'analytics:read'
    ],
    staff: [
        'menu:read',
        'orders:read', 'orders:update_status',
        'tables:read', 'tables:write',
        'restaurant:read'
    ],
    admin: [
        'menu:read', 'menu:write',
        'orders:read', 'orders:write', 'orders:update_status',
        'tables:read', 'tables:write',
        'restaurant:read', 'restaurant:write',
        'staff:manage',
        'analytics:read'
    ]
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

/**
 * Subscribe to user profile changes
 */
export const subscribeToUserProfile = (
    uid: string,
    callback: (profile: UserProfile | null) => void
): (() => void) => {
    return onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
            callback(snap.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};

/**
 * Get the current user's role
 */
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
    const profile = await getUserProfile(uid);
    return profile?.role as UserRole ?? null;
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole | null, permission: Permission): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

/**
 * Check if a role has ALL of the specified permissions
 */
export const hasAllPermissions = (role: UserRole | null, permissions: Permission[]): boolean => {
    if (!role) return false;
    return permissions.every(p => hasPermission(role, p));
};

/**
 * Check if a role has ANY of the specified permissions
 */
export const hasAnyPermission = (role: UserRole | null, permissions: Permission[]): boolean => {
    if (!role) return false;
    return permissions.some(p => hasPermission(role, p));
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
    return ROLE_PERMISSIONS[role] ?? [];
};

// ========================================
// CLIENT-SIDE RATE LIMITING
// ========================================

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
    timestamps: number[];
}

/**
 * In-memory rate limit storage
 * NOTE: This is cleared on page refresh. For persistent limiting, use server-side.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Default rate limit configurations by operation type
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    'order:create': { maxRequests: 5, windowMs: 60000 },      // 5 orders per minute
    'waiter:call': { maxRequests: 3, windowMs: 120000 },      // 3 calls per 2 minutes
    'menu:update': { maxRequests: 30, windowMs: 60000 },      // 30 updates per minute
    'table:update': { maxRequests: 20, windowMs: 60000 },     // 20 updates per minute
    'default': { maxRequests: 60, windowMs: 60000 }           // 60 requests per minute
};

/**
 * Check if a request should be rate limited
 * 
 * Uses sliding window algorithm:
 * 1. Filter timestamps to only those within the window
 * 2. If count exceeds max, reject
 * 3. Otherwise, add current timestamp and allow
 * 
 * @param key Unique identifier (usually `${userId}:${operation}`)
 * @param operation Operation type for config lookup
 * @returns Object with allowed status and remaining requests
 */
export const checkRateLimit = (
    key: string,
    operation: string = 'default'
): { allowed: boolean; remaining: number; resetMs: number } => {
    const config = RATE_LIMIT_CONFIGS[operation] || RATE_LIMIT_CONFIGS['default'];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        rateLimitStore.set(key, entry);
    }

    // Filter to only recent timestamps (sliding window)
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Check if limit exceeded
    if (entry.timestamps.length >= config.maxRequests) {
        const oldestTimestamp = entry.timestamps[0];
        const resetMs = oldestTimestamp + config.windowMs - now;

        return {
            allowed: false,
            remaining: 0,
            resetMs
        };
    }

    // Add current request
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetMs: 0
    };
};

/**
 * Clear rate limit for a key (useful for testing)
 */
export const clearRateLimit = (key: string): void => {
    rateLimitStore.delete(key);
};

/**
 * Clear all rate limits (useful for testing)
 */
export const clearAllRateLimits = (): void => {
    rateLimitStore.clear();
};

/**
 * Rate limit wrapper for async functions
 * Throws error if rate limit exceeded
 */
export const withRateLimit = <T>(
    key: string,
    operation: string,
    fn: () => Promise<T>
): Promise<T> => {
    const result = checkRateLimit(key, operation);

    if (!result.allowed) {
        const waitSeconds = Math.ceil(result.resetMs / 1000);
        throw new Error(
            `Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`
        );
    }

    return fn();
};

// ========================================
// INPUT SANITIZATION
// ========================================

/**
 * Sanitize a string to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export const sanitizeString = (input: string): string => {
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"&]/g, '') // Remove dangerous characters
        .trim();
};

/**
 * Sanitize an object's string fields recursively
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
    const result = { ...obj };

    for (const key in result) {
        const value = result[key];

        if (typeof value === 'string') {
            (result as Record<string, unknown>)[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            (result as Record<string, unknown>)[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item) :
                    typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
                        item
            );
        } else if (typeof value === 'object' && value !== null) {
            (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
        }
    }

    return result;
};

// ========================================
// SECURITY HELPERS
// ========================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return auth.currentUser !== null;
};

/**
 * Get current user's UID safely
 */
export const getCurrentUserId = (): string | null => {
    return auth.currentUser?.uid ?? null;
};

/**
 * Verify user owns a resource
 * NOTE: This is for UI only. Actual security is via Firestore rules.
 */
export const verifyOwnership = async (
    resourceOwnerId: string
): Promise<boolean> => {
    const currentUid = getCurrentUserId();
    return currentUid !== null && currentUid === resourceOwnerId;
};

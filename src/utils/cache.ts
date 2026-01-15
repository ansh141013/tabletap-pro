/**
 * Cache Utility - LocalStorage Cache Manager with TTL
 * 
 * Reduces Firestore reads by caching static/semi-static data:
 * - Menu items, categories (rarely change)
 * - Restaurant info (semi-static)
 * - User preferences
 * 
 * Features:
 * - Time-To-Live (TTL) based expiration
 * - Automatic cache invalidation
 * - Memory fallback when localStorage unavailable
 * - Type-safe cache operations
 */

// ========================================
// TYPES
// ========================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    version?: string;
}

interface CacheConfig {
    /** Default TTL in milliseconds (default: 1 hour) */
    defaultTTL: number;
    /** Cache key prefix */
    prefix: string;
    /** Version for cache invalidation on app updates */
    version: string;
}

// ========================================
// CONFIGURATION
// ========================================

const DEFAULT_CONFIG: CacheConfig = {
    defaultTTL: 60 * 60 * 1000, // 1 hour
    prefix: 'tabletap_cache_',
    version: '1.0.0'
};

let config: CacheConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the cache manager
 */
export const configureCache = (newConfig: Partial<CacheConfig>): void => {
    config = { ...config, ...newConfig };
};

// ========================================
// STORAGE HELPERS
// ========================================

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
};

/**
 * In-memory fallback cache when localStorage unavailable
 */
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Get full cache key with prefix
 */
const getCacheKey = (key: string): string => {
    return `${config.prefix}${key}`;
};

// ========================================
// CORE CACHE OPERATIONS
// ========================================

/**
 * Set a value in cache with TTL
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Time-to-live in milliseconds (default: 1 hour)
 */
export const setCache = <T>(key: string, data: T, ttlMs?: number): void => {
    const ttl = ttlMs ?? config.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        version: config.version
    };

    const cacheKey = getCacheKey(key);

    if (isLocalStorageAvailable()) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (error) {
            // localStorage might be full, use memory cache
            console.warn('[Cache] localStorage full, using memory cache:', error);
            memoryCache.set(cacheKey, entry);
        }
    } else {
        memoryCache.set(cacheKey, entry);
    }
};

/**
 * Get a value from cache
 * Returns undefined if not found or expired
 * 
 * @param key - Cache key
 * @returns Cached data or undefined
 */
export const getCache = <T>(key: string): T | undefined => {
    const cacheKey = getCacheKey(key);
    let entry: CacheEntry<T> | null = null;

    if (isLocalStorageAvailable()) {
        try {
            const stored = localStorage.getItem(cacheKey);
            if (stored) {
                entry = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('[Cache] Failed to parse localStorage entry:', error);
        }
    }

    // Fallback to memory cache
    if (!entry) {
        entry = memoryCache.get(cacheKey) ?? null;
    }

    if (!entry) {
        return undefined;
    }

    // Check version
    if (entry.version !== config.version) {
        removeCache(key);
        return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
        removeCache(key);
        return undefined;
    }

    return entry.data;
};

/**
 * Remove a value from cache
 */
export const removeCache = (key: string): void => {
    const cacheKey = getCacheKey(key);

    if (isLocalStorageAvailable()) {
        localStorage.removeItem(cacheKey);
    }

    memoryCache.delete(cacheKey);
};

/**
 * Clear all cache entries with our prefix
 */
export const clearAllCache = (): void => {
    if (isLocalStorageAvailable()) {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(config.prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    memoryCache.clear();
};

/**
 * Check if a cache entry exists and is valid
 */
export const hasValidCache = (key: string): boolean => {
    return getCache(key) !== undefined;
};

/**
 * Get cache entry metadata (for debugging)
 */
export const getCacheMetadata = (key: string): {
    exists: boolean;
    timestamp?: number;
    expiresAt?: number;
    age?: number;
    remainingTTL?: number;
} | undefined => {
    const cacheKey = getCacheKey(key);
    let entry: CacheEntry<any> | null = null;

    if (isLocalStorageAvailable()) {
        try {
            const stored = localStorage.getItem(cacheKey);
            if (stored) {
                entry = JSON.parse(stored);
            }
        } catch {
            // Ignore parse errors
        }
    }

    if (!entry) {
        entry = memoryCache.get(cacheKey) ?? null;
    }

    if (!entry) {
        return { exists: false };
    }

    const now = Date.now();
    return {
        exists: true,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
        age: now - entry.timestamp,
        remainingTTL: Math.max(0, entry.expiresAt - now)
    };
};

// ========================================
// CACHED FETCH PATTERN
// ========================================

/**
 * Options for cached fetch operations
 */
interface CachedFetchOptions<T> {
    /** Cache key */
    key: string;
    /** Function to fetch data if not cached */
    fetcher: () => Promise<T>;
    /** TTL in milliseconds */
    ttlMs?: number;
    /** Force refetch even if cached */
    forceRefresh?: boolean;
    /** Callback when data is fetched from cache */
    onCacheHit?: (data: T) => void;
    /** Callback when data is fetched fresh */
    onCacheMiss?: () => void;
}

/**
 * Fetch data with caching
 * Returns cached data if valid, otherwise fetches fresh and caches
 * 
 * @example
 * const menu = await cachedFetch({
 *   key: `menu_${restaurantId}`,
 *   fetcher: () => getPublicMenuItems(restaurantId),
 *   ttlMs: 30 * 60 * 1000, // 30 minutes
 *   onCacheHit: () => console.log('Using cached menu')
 * });
 */
export const cachedFetch = async <T>(options: CachedFetchOptions<T>): Promise<T> => {
    const { key, fetcher, ttlMs, forceRefresh, onCacheHit, onCacheMiss } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = getCache<T>(key);
        if (cached !== undefined) {
            onCacheHit?.(cached);
            return cached;
        }
    }

    // Cache miss - fetch fresh data
    onCacheMiss?.();
    const data = await fetcher();

    // Store in cache
    setCache(key, data, ttlMs);

    return data;
};

// ========================================
// SPECIALIZED CACHE HELPERS
// ========================================

/**
 * Cache keys for common data types
 */
export const CacheKeys = {
    menu: (restaurantId: string) => `menu_${restaurantId}`,
    categories: (restaurantId: string) => `categories_${restaurantId}`,
    restaurant: (restaurantId: string) => `restaurant_${restaurantId}`,
    tables: (restaurantId: string) => `tables_${restaurantId}`,
    userPrefs: (userId: string) => `user_prefs_${userId}`,
};

/**
 * TTL presets for different data types
 */
export const CacheTTL = {
    /** Menu items - 30 minutes (changes occasionally) */
    MENU: 30 * 60 * 1000,
    /** Categories - 1 hour (rarely changes) */
    CATEGORIES: 60 * 60 * 1000,
    /** Restaurant info - 1 hour (rarely changes) */
    RESTAURANT: 60 * 60 * 1000,
    /** Tables - 5 minutes (may change more often) */
    TABLES: 5 * 60 * 1000,
    /** User preferences - 24 hours */
    USER_PREFS: 24 * 60 * 60 * 1000,
    /** Short-lived cache for dynamic data */
    SHORT: 5 * 60 * 1000,
    /** Never expire (manual invalidation only) */
    PERMANENT: Infinity
};

/**
 * Invalidate all cache for a restaurant (called after menu/category updates)
 */
export const invalidateRestaurantCache = (restaurantId: string): void => {
    removeCache(CacheKeys.menu(restaurantId));
    removeCache(CacheKeys.categories(restaurantId));
    removeCache(CacheKeys.restaurant(restaurantId));
    removeCache(CacheKeys.tables(restaurantId));
};

// ========================================
// SESSION STORAGE HELPERS (for cart, etc.)
// ========================================

/**
 * Set session data (cleared when tab closes)
 */
export const setSessionData = <T>(key: string, data: T): void => {
    try {
        sessionStorage.setItem(getCacheKey(key), JSON.stringify(data));
    } catch (error) {
        console.warn('[Cache] Failed to set session data:', error);
    }
};

/**
 * Get session data
 */
export const getSessionData = <T>(key: string): T | undefined => {
    try {
        const stored = sessionStorage.getItem(getCacheKey(key));
        return stored ? JSON.parse(stored) : undefined;
    } catch {
        return undefined;
    }
};

/**
 * Remove session data
 */
export const removeSessionData = (key: string): void => {
    try {
        sessionStorage.removeItem(getCacheKey(key));
    } catch {
        // Ignore errors
    }
};

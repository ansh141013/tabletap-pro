/**
 * usePaginatedOrders Hook - Cursor-Based Pagination for Large Datasets
 * 
 * Production-grade pagination hook:
 * - Cursor-based pagination (scalable to 100k+ orders)
 * - Proper listener cleanup to prevent memory leaks
 * - Retry logic for resilience
 * - Infinite scroll support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types/models';
import { executeWithRetry, FIRESTORE_READ_RETRY_CONFIG } from '@/utils/retry';

// ========================================
// TYPES
// ========================================

export interface UsePaginatedOrdersOptions {
    /** Owner ID for filtering orders */
    ownerId: string;
    /** Restaurant ID for additional filtering (optional) */
    restaurantId?: string;
    /** Filter by order status (optional) */
    status?: Order['status'];
    /** Number of orders per page (default: 20) */
    pageSize?: number;
}

export interface UsePaginatedOrdersResult {
    /** Current loaded orders */
    orders: Order[];
    /** Loading state for initial load */
    isLoading: boolean;
    /** Loading state for pagination */
    isLoadingMore: boolean;
    /** Error state */
    error: Error | null;
    /** Whether more pages exist */
    hasMore: boolean;
    /** Total orders loaded */
    totalLoaded: number;
    /** Load next page of orders */
    loadMore: () => Promise<void>;
    /** Refresh orders from beginning */
    refresh: () => Promise<void>;
}

// ========================================
// HOOK IMPLEMENTATION
// ========================================

export const usePaginatedOrders = (
    options: UsePaginatedOrdersOptions
): UsePaginatedOrdersResult => {
    const {
        ownerId,
        restaurantId,
        status,
        pageSize = 20
    } = options;

    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Refs for cursor management
    const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const isMountedRef = useRef(true);

    // Build Firestore query
    const buildQuery = useCallback((cursor?: QueryDocumentSnapshot<DocumentData>) => {
        let constraints: any[] = [
            where('ownerId', '==', ownerId),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        ];

        // Add restaurant filter
        if (restaurantId) {
            constraints = [
                where('ownerId', '==', ownerId),
                where('restaurantId', '==', restaurantId),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            ];
        }

        // Add status filter
        if (status) {
            constraints = [
                where('ownerId', '==', ownerId),
                where('status', '==', status),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            ];
        }

        // Add cursor for pagination
        if (cursor) {
            constraints.push(startAfter(cursor));
        }

        return query(collection(db, 'orders'), ...constraints);
    }, [ownerId, restaurantId, status, pageSize]);

    // Fetch orders
    const fetchOrders = useCallback(async (isLoadMore = false) => {
        if (!ownerId) {
            setOrders([]);
            setIsLoading(false);
            return;
        }

        try {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError(null);
                lastDocRef.current = null;
            }

            const q = buildQuery(isLoadMore ? lastDocRef.current ?? undefined : undefined);

            // Use retry wrapper for resilience
            const result = await executeWithRetry(
                () => getDocs(q),
                FIRESTORE_READ_RETRY_CONFIG
            );

            if (!result.success) {
                throw result.error;
            }

            const snapshot = result.data!;

            // Check if component is still mounted
            if (!isMountedRef.current) return;

            const newOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Order[];

            // Update cursor for next page
            if (snapshot.docs.length > 0) {
                lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            }

            // Determine if more pages exist
            setHasMore(snapshot.docs.length === pageSize);

            // Update orders state
            if (isLoadMore) {
                setOrders(prev => [...prev, ...newOrders]);
            } else {
                setOrders(newOrders);
            }

        } catch (err: any) {
            console.error('[usePaginatedOrders] Fetch error:', err);
            if (isMountedRef.current) {
                setError(err);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, [ownerId, buildQuery, pageSize]);

    // Load more orders (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore || isLoading) return;
        await fetchOrders(true);
    }, [hasMore, isLoadingMore, isLoading, fetchOrders]);

    // Refresh orders from beginning
    const refresh = useCallback(async () => {
        lastDocRef.current = null;
        setHasMore(true);
        await fetchOrders(false);
    }, [fetchOrders]);

    // Effect: Initial load and cleanup
    useEffect(() => {
        isMountedRef.current = true;
        fetchOrders(false);

        // Cleanup on unmount
        return () => {
            isMountedRef.current = false;
            console.log('[usePaginatedOrders] Cleaned up on unmount');
        };
    }, [ownerId, restaurantId, status]); // Re-run when filters change

    return {
        orders,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        totalLoaded: orders.length,
        loadMore,
        refresh
    };
};

export default usePaginatedOrders;

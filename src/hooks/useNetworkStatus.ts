/**
 * useNetworkStatus Hook - Offline/Online Detection
 * 
 * Monitors network connectivity and provides:
 * - Current online/offline status
 * - Event callbacks for status changes
 * - UI helpers for offline banners
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribeToNetworkState, NetworkState, isOnline as checkIsOnline } from '@/config/firebase';

// ========================================
// TYPES
// ========================================

export interface UseNetworkStatusResult {
    /** Whether currently online */
    isOnline: boolean;
    /** Whether currently offline */
    isOffline: boolean;
    /** Network state: 'online' | 'offline' | 'unknown' */
    networkState: NetworkState;
    /** Time since last state change (ms) */
    timeSinceChange: number | null;
    /** Last time status changed */
    lastChangeTime: Date | null;
}

// ========================================
// HOOK IMPLEMENTATION
// ========================================

export const useNetworkStatus = (): UseNetworkStatusResult => {
    const [networkState, setNetworkState] = useState<NetworkState>(
        checkIsOnline() ? 'online' : 'offline'
    );
    const [lastChangeTime, setLastChangeTime] = useState<Date | null>(null);
    const [timeSinceChange, setTimeSinceChange] = useState<number | null>(null);

    // Subscribe to network state changes
    useEffect(() => {
        const unsubscribe = subscribeToNetworkState((state) => {
            setNetworkState(state);
            setLastChangeTime(new Date());
        });

        return () => unsubscribe();
    }, []);

    // Update time since change periodically
    useEffect(() => {
        if (!lastChangeTime) return;

        const interval = setInterval(() => {
            setTimeSinceChange(Date.now() - lastChangeTime.getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [lastChangeTime]);

    return {
        isOnline: networkState === 'online',
        isOffline: networkState === 'offline',
        networkState,
        timeSinceChange,
        lastChangeTime
    };
};

// ========================================
// OFFLINE BANNER COMPONENT HOOK
// ========================================

export interface UseOfflineBannerResult {
    /** Whether to show offline banner */
    showBanner: boolean;
    /** Banner message */
    message: string;
    /** Dismiss banner */
    dismiss: () => void;
}

export const useOfflineBanner = (): UseOfflineBannerResult => {
    const { isOffline, isOnline, lastChangeTime } = useNetworkStatus();
    const [dismissed, setDismissed] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    // Track if we were offline
    useEffect(() => {
        if (isOffline) {
            setWasOffline(true);
            setDismissed(false);
        }
    }, [isOffline]);

    // Auto-dismiss "back online" message after 5 seconds
    useEffect(() => {
        if (isOnline && wasOffline) {
            const timeout = setTimeout(() => {
                setWasOffline(false);
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [isOnline, wasOffline]);

    const dismiss = useCallback(() => {
        setDismissed(true);
    }, []);

    // Determine message
    let message = '';
    if (isOffline) {
        message = "You're offline. Changes will sync when you reconnect.";
    } else if (wasOffline && isOnline) {
        message = "Back online! Your changes are syncing.";
    }

    return {
        showBanner: !dismissed && (isOffline || (wasOffline && isOnline)),
        message,
        dismiss
    };
};

export default useNetworkStatus;

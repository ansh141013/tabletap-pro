/**
 * Firebase Configuration - Enhanced with Offline Persistence & Network Monitoring
 * 
 * Production-grade Firebase setup with:
 * - Environment validation
 * - Offline persistence (IndexedDB)
 * - Network state monitoring
 * - Multi-tab handling
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    connectAuthEmulator
} from 'firebase/auth';
import {
    getFirestore,
    enableIndexedDbPersistence,
    enableMultiTabIndexedDbPersistence,
    CACHE_SIZE_UNLIMITED,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ========================================
// ENVIRONMENT VALIDATION
// ========================================

interface FirebaseConfigKeys {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

/**
 * Validate all required environment variables exist
 */
const validateEnvironment = (): FirebaseConfigKeys => {
    const requiredEnvVars = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    const missingVars: string[] = [];

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        if (!value) {
            missingVars.push(`VITE_FIREBASE_${key.toUpperCase()}`);
        }
    });

    if (missingVars.length > 0) {
        const errorMessage = `Missing Firebase configuration: ${missingVars.join(', ')}. 
Please check your .env file and ensure all required variables are set.`;
        console.error('[Firebase] ' + errorMessage);

        // In development, throw error. In production, log but continue
        if (import.meta.env.DEV) {
            throw new Error(errorMessage);
        }
    }

    return requiredEnvVars as FirebaseConfigKeys;
};

const firebaseConfig = validateEnvironment();

// ========================================
// INITIALIZE FIREBASE APP
// ========================================

const app: FirebaseApp = initializeApp(firebaseConfig);

// ========================================
// INITIALIZE FIRESTORE WITH PERSISTENCE
// ========================================

/**
 * Initialize Firestore with offline persistence
 * Uses multi-tab persistence for better UX across browser tabs
 */
let db: ReturnType<typeof getFirestore>;

try {
    // Modern approach: Initialize with persistent cache
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    console.log('[Firebase] Firestore initialized with multi-tab persistence');
} catch (error: any) {
    // Fallback to standard initialization if persistence fails
    console.warn('[Firebase] Multi-tab persistence failed, using standard Firestore:', error.message);
    db = getFirestore(app);

    // Try legacy persistence for older browsers
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('[Firebase] Persistence unavailable: Multiple tabs open. Only one tab can use persistence at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('[Firebase] Persistence unavailable: Browser does not support IndexedDB.');
        }
    });
}

// ========================================
// INITIALIZE AUTHENTICATION
// ========================================

export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// ========================================
// INITIALIZE STORAGE
// ========================================

export const storage = getStorage(app);

// ========================================
// NETWORK STATE MONITORING
// ========================================

export type NetworkState = 'online' | 'offline' | 'unknown';

interface NetworkStateListener {
    (state: NetworkState): void;
}

let currentNetworkState: NetworkState = 'unknown';
const networkStateListeners: Set<NetworkStateListener> = new Set();

/**
 * Initialize network monitoring
 */
const initNetworkMonitoring = (): void => {
    if (typeof window === 'undefined') return;

    // Set initial state
    currentNetworkState = navigator.onLine ? 'online' : 'offline';

    // Listen for online/offline events
    window.addEventListener('online', () => {
        currentNetworkState = 'online';
        console.log('[Network] Connection restored');
        notifyNetworkListeners('online');
    });

    window.addEventListener('offline', () => {
        currentNetworkState = 'offline';
        console.log('[Network] Connection lost');
        notifyNetworkListeners('offline');
    });
};

/**
 * Notify all listeners of network state change
 */
const notifyNetworkListeners = (state: NetworkState): void => {
    networkStateListeners.forEach(listener => {
        try {
            listener(state);
        } catch (error) {
            console.error('[Network] Listener error:', error);
        }
    });
};

/**
 * Subscribe to network state changes
 * @returns Unsubscribe function
 */
export const subscribeToNetworkState = (listener: NetworkStateListener): (() => void) => {
    networkStateListeners.add(listener);

    // Immediately call with current state
    listener(currentNetworkState);

    return () => {
        networkStateListeners.delete(listener);
    };
};

/**
 * Get current network state
 */
export const getNetworkState = (): NetworkState => currentNetworkState;

/**
 * Check if currently online
 */
export const isOnline = (): boolean => currentNetworkState === 'online';

// Initialize network monitoring
initNetworkMonitoring();

// ========================================
// FIRESTORE NETWORK STATE
// ========================================

import { enableNetwork, disableNetwork } from 'firebase/firestore';

/**
 * Manually enable Firestore network (for testing/debugging)
 */
export const enableFirestoreNetwork = async (): Promise<void> => {
    try {
        await enableNetwork(db);
        console.log('[Firebase] Firestore network enabled');
    } catch (error) {
        console.error('[Firebase] Failed to enable network:', error);
    }
};

/**
 * Manually disable Firestore network (for testing offline mode)
 */
export const disableFirestoreNetwork = async (): Promise<void> => {
    try {
        await disableNetwork(db);
        console.log('[Firebase] Firestore network disabled');
    } catch (error) {
        console.error('[Firebase] Failed to disable network:', error);
    }
};

// ========================================
// DEVELOPMENT HELPERS
// ========================================

// For local development with emulators
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
    console.log('[Firebase] Connecting to emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    // Note: Firestore emulator connection should be done before any Firestore operations
}

// ========================================
// EXPORTS
// ========================================

export { db };
export default app;

// ========================================
// DEBUG UTILITIES (Development Only)
// ========================================

if (import.meta.env.DEV) {
    // Expose Firebase instances for debugging
    (window as any).__firebase__ = {
        app,
        db,
        auth,
        storage,
        getNetworkState,
        enableFirestoreNetwork,
        disableFirestoreNetwork
    };

    console.log('[Firebase] Debug utilities available at window.__firebase__');
}

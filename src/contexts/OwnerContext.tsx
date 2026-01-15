/**
 * OwnerContext - Global Owner Settings Provider
 * 
 * This context provides a single source of truth for owner-level settings
 * (currency, language, timezone) that propagate across the entire application.
 * 
 * Usage:
 * 1. Wrap your app with <OwnerProvider>
 * 2. Use useOwnerSettings() hook to access settings
 * 3. Settings are automatically loaded when user logs in
 * 4. Updates are immediately synced to Firestore and UI
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerSettings, Restaurant } from '@/types/models';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol, DEFAULT_CURRENCY } from '@/utils/currency';
import { getTranslations, t as translateUtil, DEFAULT_LANGUAGE, TranslationKeys } from '@/utils/language';

// ================================
// TYPES
// ================================

interface OwnerContextType {
    // Settings
    settings: OwnerSettings;
    restaurant: Restaurant | null;
    isLoading: boolean;
    error: string | null;

    // Currency helpers
    formatCurrency: (amount: number | string | undefined | null, options?: {
        showSymbol?: boolean;
        showCode?: boolean;
        compact?: boolean;
    }) => string;
    currencySymbol: string;

    // Language helpers
    translations: TranslationKeys;
    t: (path: string) => string;
    language: string;

    // Actions
    updateSettings: (newSettings: Partial<OwnerSettings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: OwnerSettings = {
    currency: DEFAULT_CURRENCY,
    language: DEFAULT_LANGUAGE,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

// ================================
// PROVIDER COMPONENT
// ================================

export function OwnerProvider({ children }: { children: React.ReactNode }) {
    const { user, userProfile } = useAuth();

    const [settings, setSettings] = useState<OwnerSettings>(defaultSettings);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to restaurant document for real-time updates
    useEffect(() => {
        if (!userProfile?.restaurantId) {
            setIsLoading(false);
            setRestaurant(null);
            setSettings(defaultSettings);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Real-time listener on restaurant document
        const unsubscribe = onSnapshot(
            doc(db, 'restaurants', userProfile.restaurantId),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as Restaurant;
                    const fullRestaurant = { id: snap.id, ...data };
                    setRestaurant(fullRestaurant);

                    // Extract settings from restaurant
                    setSettings({
                        currency: data.currency || DEFAULT_CURRENCY,
                        language: data.language || DEFAULT_LANGUAGE,
                        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    });
                } else {
                    setRestaurant(null);
                    setSettings(defaultSettings);
                }
                setIsLoading(false);
            },
            (err) => {
                console.error('[OwnerContext] Error loading restaurant:', err);
                setError('Failed to load settings');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userProfile?.restaurantId]);

    // Update settings in Firestore
    const updateSettings = useCallback(async (newSettings: Partial<OwnerSettings>) => {
        if (!userProfile?.restaurantId) {
            throw new Error('No restaurant found');
        }

        try {
            const restaurantRef = doc(db, 'restaurants', userProfile.restaurantId);
            await updateDoc(restaurantRef, {
                ...newSettings,
            });

            // Optimistic update (will be overwritten by onSnapshot)
            setSettings(prev => ({ ...prev, ...newSettings }));

            console.log('[OwnerContext] Settings updated:', newSettings);
        } catch (err) {
            console.error('[OwnerContext] Error updating settings:', err);
            throw err;
        }
    }, [userProfile?.restaurantId]);

    // Force refresh settings
    const refreshSettings = useCallback(async () => {
        // The onSnapshot listener handles this automatically
        // This is a no-op but can be extended if needed
    }, []);

    // Currency formatting bound to current currency setting
    const formatCurrency = useCallback((
        amount: number | string | undefined | null,
        options?: { showSymbol?: boolean; showCode?: boolean; compact?: boolean }
    ) => {
        return formatCurrencyUtil(amount, settings.currency, options);
    }, [settings.currency]);

    // Get currency symbol
    const currencySymbol = useMemo(() => {
        return getCurrencySymbol(settings.currency);
    }, [settings.currency]);

    // Get translations for current language
    const translations = useMemo(() => {
        return getTranslations(settings.language);
    }, [settings.language]);

    // Translate function bound to current language
    const t = useCallback((path: string) => {
        return translateUtil(path, settings.language);
    }, [settings.language]);

    // Context value
    const value = useMemo<OwnerContextType>(() => ({
        settings,
        restaurant,
        isLoading,
        error,
        formatCurrency,
        currencySymbol,
        translations,
        t,
        language: settings.language,
        updateSettings,
        refreshSettings,
    }), [
        settings,
        restaurant,
        isLoading,
        error,
        formatCurrency,
        currencySymbol,
        translations,
        t,
        updateSettings,
        refreshSettings,
    ]);

    return (
        <OwnerContext.Provider value={value}>
            {children}
        </OwnerContext.Provider>
    );
}

// ================================
// HOOK
// ================================

/**
 * Hook to access owner settings and helpers
 * 
 * @example
 * const { formatCurrency, t, settings, updateSettings } = useOwnerSettings();
 * 
 * // Format currency
 * formatCurrency(99.99) // => "₹99.99" or "$99.99" based on settings
 * 
 * // Translate
 * t('orders.pending') // => "Pending" or "लंबित" based on settings
 * 
 * // Update settings
 * await updateSettings({ currency: 'INR', language: 'hi' });
 */
export function useOwnerSettings(): OwnerContextType {
    const context = useContext(OwnerContext);

    if (context === undefined) {
        throw new Error('useOwnerSettings must be used within an OwnerProvider');
    }

    return context;
}

// ================================
// UTILITY HOOKS
// ================================

/**
 * Hook for just currency formatting (lightweight)
 */
export function useCurrency() {
    const { formatCurrency, currencySymbol, settings } = useOwnerSettings();
    return { formatCurrency, currencySymbol, currency: settings.currency };
}

/**
 * Hook for just translations (lightweight)
 */
export function useTranslations() {
    const { translations, t, language } = useOwnerSettings();
    return { translations, t, language };
}

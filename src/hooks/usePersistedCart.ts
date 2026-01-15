/**
 * usePersistedCart Hook - Session Storage Cart Persistence
 * 
 * Persists cart data across page refreshes within the same session:
 * - Saves cart to sessionStorage on every change
 * - Restores cart on mount
 * - Error boundary for storage failures
 * - Automatic cleanup on checkout/clear
 */

import { useState, useEffect, useCallback } from 'react';
import { getSessionData, setSessionData, removeSessionData } from '@/utils/cache';

// ========================================
// TYPES
// ========================================

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    imageUrl?: string;
}

export interface PersistedCartState {
    items: CartItem[];
    restaurantId: string | null;
    tableId: string | null;
    tableNumber: number | null;
    lastUpdated: number;
}

export interface UsePersistedCartResult {
    /** Current cart items */
    items: CartItem[];
    /** Restaurant ID associated with cart */
    restaurantId: string | null;
    /** Table ID associated with cart */
    tableId: string | null;
    /** Table number */
    tableNumber: number | null;
    /** Total price */
    total: number;
    /** Total items count */
    itemCount: number;
    /** Add item to cart */
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    /** Update item quantity */
    updateItemQuantity: (itemId: string, quantity: number) => void;
    /** Update item notes */
    updateItemNotes: (itemId: string, notes: string) => void;
    /** Remove item from cart */
    removeItem: (itemId: string) => void;
    /** Clear entire cart */
    clearCart: () => void;
    /** Set restaurant/table context */
    setContext: (restaurantId: string, tableId: string | null, tableNumber: number | null) => void;
    /** Check if cart has items from a different restaurant */
    hasConflictingRestaurant: (restaurantId: string) => boolean;
    /** Is cart being restored from storage */
    isRestoring: boolean;
}

// ========================================
// CONSTANTS
// ========================================

const CART_STORAGE_KEY = 'cart_state';

// ========================================
// HOOK IMPLEMENTATION
// ========================================

export const usePersistedCart = (): UsePersistedCartResult => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableId, setTableId] = useState<string | null>(null);
    const [tableNumber, setTableNumber] = useState<number | null>(null);
    const [isRestoring, setIsRestoring] = useState(true);

    // Calculate totals
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Persist cart to session storage
    const persistCart = useCallback((
        newItems: CartItem[],
        newRestaurantId: string | null,
        newTableId: string | null,
        newTableNumber: number | null
    ) => {
        try {
            const state: PersistedCartState = {
                items: newItems,
                restaurantId: newRestaurantId,
                tableId: newTableId,
                tableNumber: newTableNumber,
                lastUpdated: Date.now()
            };
            setSessionData(CART_STORAGE_KEY, state);
        } catch (error) {
            console.error('[usePersistedCart] Failed to persist cart:', error);
        }
    }, []);

    // Restore cart from session storage on mount
    useEffect(() => {
        try {
            const savedState = getSessionData<PersistedCartState>(CART_STORAGE_KEY);

            if (savedState) {
                // Validate saved state structure
                if (Array.isArray(savedState.items)) {
                    setItems(savedState.items);
                    setRestaurantId(savedState.restaurantId);
                    setTableId(savedState.tableId);
                    setTableNumber(savedState.tableNumber);
                    console.log('[usePersistedCart] Cart restored:', savedState.items.length, 'items');
                }
            }
        } catch (error) {
            console.error('[usePersistedCart] Failed to restore cart:', error);
        } finally {
            setIsRestoring(false);
        }
    }, []);

    // Persist whenever cart changes
    useEffect(() => {
        if (!isRestoring) {
            persistCart(items, restaurantId, tableId, tableNumber);
        }
    }, [items, restaurantId, tableId, tableNumber, isRestoring, persistCart]);

    // Add item to cart
    const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(i => i.id === item.id);

            if (existingIndex >= 0) {
                // Update existing item
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + quantity
                };
                return updated;
            }

            // Add new item
            return [...prev, { ...item, quantity }];
        });
    }, []);

    // Update item quantity
    const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            setItems(prev => prev.filter(item => item.id !== itemId));
        } else {
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            ));
        }
    }, []);

    // Update item notes
    const updateItemNotes = useCallback((itemId: string, notes: string) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, notes } : item
        ));
    }, []);

    // Remove item from cart
    const removeItem = useCallback((itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    }, []);

    // Clear entire cart
    const clearCart = useCallback(() => {
        setItems([]);
        setRestaurantId(null);
        setTableId(null);
        setTableNumber(null);
        removeSessionData(CART_STORAGE_KEY);
        console.log('[usePersistedCart] Cart cleared');
    }, []);

    // Set restaurant/table context
    const setContext = useCallback((
        newRestaurantId: string,
        newTableId: string | null,
        newTableNumber: number | null
    ) => {
        // If switching restaurants, clear cart
        if (restaurantId && restaurantId !== newRestaurantId && items.length > 0) {
            console.log('[usePersistedCart] Restaurant changed, clearing cart');
            setItems([]);
        }

        setRestaurantId(newRestaurantId);
        setTableId(newTableId);
        setTableNumber(newTableNumber);
    }, [restaurantId, items.length]);

    // Check if cart has items from a different restaurant
    const hasConflictingRestaurant = useCallback((checkRestaurantId: string): boolean => {
        return items.length > 0 && restaurantId !== null && restaurantId !== checkRestaurantId;
    }, [items.length, restaurantId]);

    return {
        items,
        restaurantId,
        tableId,
        tableNumber,
        total,
        itemCount,
        addItem,
        updateItemQuantity,
        updateItemNotes,
        removeItem,
        clearCart,
        setContext,
        hasConflictingRestaurant,
        isRestoring
    };
};

export default usePersistedCart;

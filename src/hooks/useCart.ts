import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string | null;
    notes?: string;
}

export const useCart = (restaurantId: string | undefined, tableId: string | null) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load cart
    useEffect(() => {
        if (!restaurantId || !tableId) return;
        const savedCart = localStorage.getItem(`cart_${restaurantId}_${tableId}`);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, [restaurantId, tableId]);

    // Save cart
    useEffect(() => {
        if (!restaurantId || !tableId) return;
        localStorage.setItem(`cart_${restaurantId}_${tableId}`, JSON.stringify(cart));
    }, [cart, restaurantId, tableId]);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.id === item.id);
            if (existing) {
                return prev.map((c) =>
                    c.id === item.id ? { ...c, quantity: c.quantity + (item.quantity || 1) } : c
                );
            }
            return [...prev, { ...item, quantity: item.quantity || 1 }];
        });
        // This toast should be triggered by the UI, but we can do it here optionally. 
        // The requirement says "Show '+1' animation" and "Pulse".
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.id === itemId) {
                    return { ...item, quantity: Math.max(0, item.quantity + delta) };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
        if (restaurantId && tableId) {
            localStorage.removeItem(`cart_${restaurantId}_${tableId}`);
        }
    };

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen
    };
};

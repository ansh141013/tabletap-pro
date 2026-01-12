import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMenu, createOrder } from '../../services/firebaseService';
import { MenuItem, OrderItem } from '../../types/firebase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const MenuStub = () => {
    const { restaurantId, tableId } = useParams<{ restaurantId: string; tableId: string }>();
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (restaurantId) {
            loadMenu();
        }
    }, [restaurantId]);

    const loadMenu = async () => {
        try {
            const items = await getMenu(restaurantId!);
            setMenu(items);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load menu");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id!, name: item.name, price: item.price, quantity: 1 }];
        });
        toast.info(`Added ${item.name}`);
    };

    const placeOrder = async () => {
        if (!restaurantId || !tableId) return;
        try {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await createOrder({
                restaurantId,
                tableId,
                tableNumber: '1', // Should fetch table info
                items: cart,
                total,
            });
            setCart([]);
            toast.success("Order placed successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to place order");
        }
    };

    if (loading) return <div>Loading Menu...</div>;

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Menu</h1>
            <div className="space-y-4 mb-8">
                {menu.map(item => (
                    <div key={item.id} className="border p-4 rounded flex justify-between items-center shadow-sm">
                        <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            <p className="font-bold mt-1">${item.price}</p>
                        </div>
                        <Button size="sm" onClick={() => addToCart(item)}>Add</Button>
                    </div>
                ))}
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Total: ${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)}</span>
                        <span>{cart.reduce((c, i) => c + i.quantity, 0)} Items</span>
                    </div>
                    <Button className="w-full" onClick={placeOrder}>Place Order</Button>
                </div>
            )}
        </div>
    );
};

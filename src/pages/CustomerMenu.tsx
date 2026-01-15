import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRestaurant, getCategories, getMenuItems, createOrder } from '@/services/firebaseService';
import { Restaurant, Category, MenuItem, Order, OrderItem } from '@/types/models';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

export const CustomerMenu = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [restaurantId, setRestaurantId] = useState<string>('');
    const [tableId, setTableId] = useState<string>('');
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<OrderItem[]>([]);

    useEffect(() => {
        const rId = searchParams.get('r');
        const tId = searchParams.get('t');

        if (rId && tId) {
            setRestaurantId(rId);
            setTableId(tId);
            loadData(rId);
        } else {
            toast.error("Invalid QR Link");
            setLoading(false);
        }
    }, [searchParams]);

    const loadData = async (rId: string) => {
        try {
            const rest = await getRestaurant(rId);
            if (!rest) throw new Error("Restaurant not found");
            setRestaurant(rest);

            const cats = await getCategories(rId);
            setCategories(cats);

            const items = await getMenuItems(rId);
            setMenuItems(items);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load menu");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.itemId === item.id);
            if (existing) {
                return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { itemId: item.id!, name: item.name, price: item.price, quantity: 1 }];
        });
        toast.success("Added to cart");
    };

    const placeOrder = async () => {
        if (!restaurantId || !tableId) return;
        try {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await createOrder({
                restaurantId,
                tableId,
                tableNumber: '1', // Needs to fetch table info to get number, skipping for brevity
                items: cart,
                total,
            });
            setCart([]);
            toast.success("Order sent to kitchen!");
        } catch (error) {
            console.error(error);
            toast.error("Order failed");
        }
    };

    if (loading) return <div>Loading Menu...</div>;
    if (!restaurant) return <div>Restaurant not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
                <h1 className="text-xl font-bold">{restaurant.name}</h1>
            </div>

            <div className="p-4 space-y-8">
                {categories.map(cat => (
                    <div key={cat.id}>
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">{cat.name}</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {menuItems.filter(i => i.categoryId === cat.id).map(item => (
                                <div key={item.id} className="bg-white p-4 rounded shadow flex justify-between">
                                    <div>
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <p className="text-gray-500 text-sm">{item.description}</p>
                                        <p className="font-bold mt-1">${item.price}</p>
                                    </div>
                                    <button onClick={() => addToCart(item)} className="bg-blue-600 text-white px-4 py-2 rounded h-fit">Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {/* Uncategorized */}
                {menuItems.filter(i => !i.categoryId).length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Other</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {menuItems.filter(i => !i.categoryId).map(item => (
                                <div key={item.id} className="bg-white p-4 rounded shadow flex justify-between">
                                    <div>
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <p className="text-gray-500 text-sm">{item.description}</p>
                                        <p className="font-bold mt-1">${item.price}</p>
                                    </div>
                                    <button onClick={() => addToCart(item)} className="bg-blue-600 text-white px-4 py-2 rounded h-fit">Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-0 w-full bg-white border-t p-4 shadow-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold">{cart.reduce((c, i) => c + i.quantity, 0)} Items</p>
                        <p>${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</p>
                    </div>
                    <button onClick={placeOrder} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold">
                        Place Order
                    </button>
                </div>
            )}
        </div>
    );
};

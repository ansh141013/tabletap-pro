import { useEffect, useState } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../../services/firebaseService';
import { Order } from '../../types/firebase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AdminStub = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);

    // In a real app, you'd fetch this from the user's profile
    const restaurantId = "placeholder_restaurant_id";

    useEffect(() => {
        if (!restaurantId) return;

        const unsubscribe = subscribeToOrders(restaurantId, (data) => {
            setOrders(data);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Kitchen Display System / Admin</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map(order => (
                    <div key={order.id} className={`border p-4 rounded-lg shadow-sm ${order.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">Table {order.tableNumber}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-gray-200 uppercase">{order.status}</span>
                        </div>
                        <ul className="mb-4 space-y-1">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>${item.price * item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 mt-auto">
                            {order.status === 'pending' && (
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusUpdate(order.id!, 'preparing')}>
                                    Start Preparing
                                </Button>
                            )}
                            {order.status === 'preparing' && (
                                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(order.id!, 'ready')}>
                                    Mark Ready
                                </Button>
                            )}
                            {order.status === 'ready' && (
                                <Button size="sm" className="w-full bg-gray-600 hover:bg-gray-700" onClick={() => handleStatusUpdate(order.id!, 'served')}>
                                    Mark Served
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {orders.length === 0 && <p className="text-center text-gray-500 mt-10">No active orders</p>}
        </div>
    );
};

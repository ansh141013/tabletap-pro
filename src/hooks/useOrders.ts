import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderItem } from "@/types/models";
import { subscribeToOrders, updateOrderStatus as updateStatusInDb, getOrderItems } from "@/services/firebaseService";

// Map types for backward compatibility if needed, using Firebase Types directly
export type { Order, OrderItem };
export type OrderStatus = Order['status'];

const AUTO_CANCEL_MINUTES = 10;
const isDevMode = sessionStorage.getItem('devMode') === 'true';

export function useOrders(ownerId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const autoCancelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ownerId || isDevMode) {
      if (isDevMode) {
        setIsLoading(false);
        // Stub mock orders if needed
      }
      return;
    }

    // Subscribe to orders (Firebase real-time) - now filtered by ownerId
    const unsubscribe = subscribeToOrders(ownerId, (newOrders) => {
      setOrders(newOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    try {
      // In Firestore, order items are embedded in the order document or a subcollection.
      // My previous service implementation expects subcollection or embedded array.
      // Let's assume the order object in state already has items if I designed it that way,
      // OR we fetch them. The Firebase Service subscribeToOrders returns ID and data, but data might not deep fetch subcollections if they are subcollections.
      // Let's implement getOrderItems in service if strictly needed, or assume they are passed.

      // Checking Order type, it has `items: OrderItem[]`.
      // If subscribeToOrders fetches them, we have them.

      const order = orders.find(o => o.id === orderId);
      if (order?.items) return order.items;

      return await getOrderItems(orderId); // Helper to fetch if not present
    } catch (error) {
      console.error("Error fetching order items:", error);
      return [];
    }
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      await updateStatusInDb(orderId, newStatus, order?.tableId);

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderId(null);
    }
  }, [toast, orders]);

  // Auto-cancel logic can be handled here or by a Cloud Function. 
  // Client-side auto-cancel is unreliable (needs open dashboard), but good enough for MVP.
  const checkAutoCancelOrders = useCallback(async () => {
    const now = new Date();
    const pendingOrders = orders.filter(o => o.status === "pending");

    for (const order of pendingOrders) {
      const createdAt = new Date(order.createdAt);
      const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (minutesElapsed >= AUTO_CANCEL_MINUTES) {
        await updateOrderStatus(order.id!, "auto_cancelled");
        toast({
          title: "Order Auto-Cancelled",
          description: `Order from Table ${order.tableNumber} was auto-cancelled`,
          variant: "destructive",
        });
      }
    }
  }, [orders, updateOrderStatus, toast]);

  useEffect(() => {
    autoCancelIntervalRef.current = setInterval(checkAutoCancelOrders, 60000);
    return () => {
      if (autoCancelIntervalRef.current) clearInterval(autoCancelIntervalRef.current);
    };
  }, [checkAutoCancelOrders]);


  return {
    orders,
    isLoading,
    loadingOrderId,
    updateOrderStatus,
    fetchOrderItems,
    refetch: () => { }, // No-op as subscription handles it
  };
}

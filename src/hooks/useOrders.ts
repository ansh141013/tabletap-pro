import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled" | "auto_cancelled";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  table_number: number;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

const AUTO_CANCEL_MINUTES = 10;

const isDevMode = sessionStorage.getItem('devMode') === 'true';

// Mock data generator
const generateMockOrders = (): Order[] => [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    restaurant_id: "00000000-0000-0000-0000-000000000001",
    table_number: 1,
    customer_name: "Mock User",
    status: "pending",
    total: 45.50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const autoCancelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      if (isDevMode) {
        console.log("Dev Mode: Loading mock orders");
        setOrders(generateMockOrders());
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    if (isDevMode) {
      return [
        { id: "1", name: "Mock Burger", quantity: 2, price: 15.00, notes: "No onions" },
        { id: "2", name: "Mock Fries", quantity: 1, price: 5.50 }
      ];
    }

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      return (data as OrderItem[]) || [];
    } catch (error) {
      console.error("Error fetching order items:", error);
      return [];
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    try {
      if (isDevMode) {
        toast({
          title: "Dev Mode",
          description: `Mock order updated to ${newStatus}`,
        });
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setLoadingOrderId(null);
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Unlock table if order is accepted, cancelled, or served
      if (["accepted", "cancelled", "auto_cancelled", "served"].includes(newStatus)) {
        const order = orders.find(o => o.id === orderId);
        if (order?.table_id) {
          await supabase
            .from("tables")
            .update({ is_locked: false })
            .eq("id", order.table_id);
        }
      }

      // Track abuse for cancelled orders
      if (newStatus === "cancelled" || newStatus === "auto_cancelled") {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await incrementAbuseScore(order.restaurant_id, order.customer_name, order.customer_phone);
        }
      }

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

  const incrementAbuseScore = async (restaurantId: string, customerName: string, customerPhone?: string) => {
    if (isDevMode) return;
    try {
      // Check if entry exists
      const { data: existing } = await supabase
        .from("abuse_tracking")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("customer_name", customerName)
        .single();

      if (existing) {
        await supabase
          .from("abuse_tracking")
          .update({
            abuse_score: existing.abuse_score + 1,
            last_incident_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("abuse_tracking")
          .insert({
            restaurant_id: restaurantId,
            customer_name: customerName,
            customer_phone: customerPhone,
            abuse_score: 1,
            last_incident_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error("Error tracking abuse:", error);
    }
  };

  // Auto-cancel pending orders after 10 minutes
  const checkAutoCancelOrders = useCallback(async () => {
    const now = new Date();
    const pendingOrders = orders.filter(o => o.status === "pending");

    for (const order of pendingOrders) {
      const createdAt = new Date(order.created_at);
      const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (minutesElapsed >= AUTO_CANCEL_MINUTES) {
        await updateOrderStatus(order.id, "auto_cancelled");
        toast({
          title: "Order Auto-Cancelled",
          description: `Order from Table ${order.table_number} was auto-cancelled after ${AUTO_CANCEL_MINUTES} minutes`,
          variant: "destructive",
        });
      }
    }
  }, [orders, updateOrderStatus, toast]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-cancel interval
  useEffect(() => {
    autoCancelIntervalRef.current = setInterval(checkAutoCancelOrders, 60000); // Check every minute

    return () => {
      if (autoCancelIntervalRef.current) {
        clearInterval(autoCancelIntervalRef.current);
      }
    };
  }, [checkAutoCancelOrders]);

  // Real-time subscription for updates
  useEffect(() => {
    if (isDevMode) return;

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    isLoading,
    loadingOrderId,
    updateOrderStatus,
    fetchOrderItems,
    refetch: fetchOrders,
  };
}

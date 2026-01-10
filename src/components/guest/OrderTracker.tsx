import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle2, UtensilsCrossed, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  table_number: number;
  order_items?: any[];
}

interface OrderTrackerProps {
  restaurantId: string;
  tableNumber: number;
  currency: string;
}

const STATUS_STEPS = ["pending", "accepted", "preparing", "ready", "served"];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-500" },
  accepted: { label: "Accepted", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-blue-500" },
  preparing: { label: "Preparing", icon: <ChefHat className="h-4 w-4" />, color: "bg-orange-500" },
  ready: { label: "Ready", icon: <UtensilsCrossed className="h-4 w-4" />, color: "bg-green-500" },
  served: { label: "Served", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-primary" },
  cancelled: { label: "Cancelled", icon: <X className="h-4 w-4" />, color: "bg-destructive" },
};

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const OrderTracker = ({ restaurantId, tableNumber, currency }: OrderTrackerProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch active orders for this table
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, created_at, total, table_number, order_items")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableNumber)
        .in("status", ["pending", "accepted", "preparing", "ready", "served"])
        .order("created_at", { ascending: false });

      setOrders((data as unknown as Order[]) || []);
    };

    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`orders-table-${tableNumber}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            if (newOrder.table_number === tableNumber) {
              setOrders((prev) => [newOrder, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            if (updatedOrder.table_number === tableNumber) {
              // Determine if we should keep it
              // We keep 'served' to show success message, but remove 'cancelled' or 'completed' (archived)
              if (["completed", "cancelled", "auto_cancelled"].includes(updatedOrder.status)) {
                setOrders((prev) => prev.filter(o => o.id !== updatedOrder.id));
                if (updatedOrder.status === "auto_cancelled") {
                  toast({ title: "Order Timed Out", description: "Your order was not accepted in time.", variant: "destructive" });
                }
              } else if (updatedOrder.status === "served") {
                setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
                toast({ title: "Order Served!", description: "Enjoy your meal! 🍽️" });
              } else {
                setOrders((prev) =>
                  prev
                    .map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                );
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableNumber]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" } as any)
        .eq("id", orderId);

      if (error) throw error;

      // Also unlock table
      await supabase
        .from("tables")
        .update({ status: "available", current_order_id: null } as any)
        .eq("table_number", tableNumber)
        .eq("restaurant_id", restaurantId);

      toast({ title: "Order Cancelled" });
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e: any) {
      toast({ title: "Failed to cancel", description: e.message, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  const handleDismiss = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  if (orders.length === 0) return null;

  const getCurrentStep = (status: string) => {
    const index = STATUS_STEPS.indexOf(status);
    return index >= 0 ? index : 0;
  };

  return (
    <Card className="mb-4 shadow-md border-primary/20">
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Your Orders
            <Badge variant="secondary" className="bg-primary/10 text-primary">{orders.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6 pt-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const currentStep = getCurrentStep(order.status);
            const items = Array.isArray(order.order_items) ? order.order_items : [];

            return (
              <div key={order.id} className="space-y-4 p-4 bg-background border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${config.color} text-white shadow-sm`}>
                      {config.icon}
                      <span className="ml-1 capitalize">{config.label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      Order #{order.id.slice(0, 4)} • {formatTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatPrice(order.total, currency)}</span>
                </div>

                {/* Progress bar */}
                {order.status !== 'served' && (
                  <div className="relative pt-2 pb-4">
                    <div className="flex items-center gap-1 justify-between text-xs text-muted-foreground mb-2 px-1">
                      <span>Placed</span>
                      <span>Prep</span>
                      <span>Ready</span>
                    </div>
                    <div className="flex items-center h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${config.color}`}
                        style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="text-sm space-y-1 border-t pt-3 mt-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-muted-foreground">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity, currency)}</span>
                    </div>
                  ))}
                </div>

                {order.status === 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs h-8"
                    disabled={cancellingId === order.id}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    {cancellingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel Order"}
                  </Button>
                )}

                {order.status === 'served' && (
                  <div className="text-center space-y-2">
                    <p className="text-green-600 font-medium text-sm">Enjoy your meal!</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleDismiss(order.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
};

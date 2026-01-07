import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  table_number: number;
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

  useEffect(() => {
    // Fetch active orders for this table
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, created_at, total, table_number")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableNumber)
        .in("status", ["pending", "accepted", "preparing", "ready"])
        .order("created_at", { ascending: false });

      setOrders((data as Order[]) || []);
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
              setOrders((prev) =>
                prev
                  .map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                  .filter((o) => ["pending", "accepted", "preparing", "ready"].includes(o.status))
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableNumber]);

  if (orders.length === 0) return null;

  const getCurrentStep = (status: string) => {
    const index = STATUS_STEPS.indexOf(status);
    return index >= 0 ? index : 0;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active Orders
            <Badge variant="secondary">{orders.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const currentStep = getCurrentStep(order.status);

            return (
              <div key={order.id} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${config.color} text-white`}>
                      {config.icon}
                      <span className="ml-1">{config.label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(order.total, currency)}</span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1">
                  {STATUS_STEPS.slice(0, 4).map((step, index) => (
                    <div key={step} className="flex-1 flex items-center">
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          index <= currentStep ? config.color : "bg-muted"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pending</span>
                  <span>Preparing</span>
                  <span>Ready</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
};

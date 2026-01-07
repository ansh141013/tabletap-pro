import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  CheckCircle,
  ChefHat,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "text-info bg-info/10", icon: Clock, label: "Pending" };
    case "accepted":
      return { color: "text-primary bg-primary/10", icon: CheckCircle, label: "Accepted" };
    case "preparing":
      return { color: "text-warning bg-warning/10", icon: ChefHat, label: "Preparing" };
    case "ready":
      return { color: "text-success bg-success/10", icon: CheckCircle, label: "Ready" };
    case "served":
      return { color: "text-muted-foreground bg-muted", icon: CheckCircle, label: "Served" };
    default:
      return { color: "text-muted-foreground bg-muted", icon: AlertCircle, label: status };
  }
};

const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "Just now";
  }
};

export const DashboardHome = () => {
  const { orders, isLoading } = useOrders();
  
  // Enable real-time notifications with sound
  useOrderNotifications();

  const recentOrders = orders.slice(0, 4);
  const activeOrders = orders.filter(o => ["pending", "accepted", "preparing", "ready"].includes(o.status));
  const todayTotal = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);

  return (
    <>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {[
          { label: "Today's Orders", value: orders.length.toString(), change: "", positive: true },
          { label: "Revenue", value: `$${todayTotal.toFixed(2)}`, change: "", positive: true },
          { label: "Active Orders", value: activeOrders.length.toString(), change: "", positive: true },
          { label: "Pending", value: orders.filter(o => o.status === "pending").length.toString(), change: "", positive: true },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 md:p-6 bg-card rounded-xl border border-border shadow-sm"
          >
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
              {stat.change && (
                <span className={`text-sm font-medium ${stat.positive ? "text-success" : "text-destructive"}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <span className="flex items-center gap-2 text-sm text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No orders yet. Orders will appear here in real-time.
            </div>
          ) : (
            recentOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Table {order.table_number}</span>
                      <span className="text-xs text-muted-foreground">{order.customer_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-sm text-muted-foreground">{formatTime(order.created_at)}</span>
                    <span className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}>
                      <statusConfig.icon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                    <span className="font-medium text-foreground">${Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/dashboard/orders">View all orders</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

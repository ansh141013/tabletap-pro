import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  CheckCircle,
  ChefHat,
  XCircle,
  MoreVertical,
  Eye,
  X,
  Volume2,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useOrders, OrderStatus, OrderItem } from "@/hooks/useOrders";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerSettings } from "@/contexts/OwnerContext";

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock, label: "Pending" };
    case "accepted":
      return { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle, label: "Accepted" };
    case "preparing":
      return { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: ChefHat, label: "Preparing" };
    case "ready":
      return { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle, label: "Ready" };
    case "served":
      return { color: "bg-muted text-muted-foreground border-border", icon: CheckCircle, label: "Served" };
    case "cancelled":
      return { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle, label: "Cancelled" };
    case "auto_cancelled":
      return { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle, label: "Auto-Cancelled" };
    default:
      return { color: "bg-muted text-muted-foreground border-border", icon: Clock, label: status };
  }
};

const formatTime = (date: any) => {
  try {
    let d = date;
    if (date?.toDate) d = date.toDate();
    if (!d) return "Just now";
    return formatDistanceToNow(new Date(d), { addSuffix: true });
  } catch {
    return "Just now";
  }
};

const formatDate = (date: any) => {
  try {
    let d = date;
    if (date?.toDate) d = date.toDate();
    if (!d) return "Unknown";
    return new Date(d).toLocaleString();
  } catch {
    return "Unknown";
  }
};

export const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { user, userProfile } = useAuth();
  const { formatCurrency } = useOwnerSettings();
  const { orders, isLoading, loadingOrderId, updateOrderStatus, fetchOrderItems } = useOrders(user?.uid);
  const { playNotificationSound } = useOrderNotifications(user?.uid || null);
  const { toast } = useToast();


  const safeOrders = orders || [];
  const filteredOrders = activeTab === "all"
    ? safeOrders
    : safeOrders.filter(order => {
      if (activeTab === "active") return ["pending", "accepted", "preparing", "ready"].includes(order.status);
      return order.status === activeTab;
    });

  const handleToggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      if (!orderItems[orderId]) {
        try {
          const items = await fetchOrderItems(orderId);
          setOrderItems(prev => ({ ...prev, [orderId]: items }));
        } catch (error) {
          console.error("Failed to fetch order items", error);
        }
      }
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectOrderId) return;

    await updateOrderStatus(rejectOrderId, "cancelled");
    setShowRejectDialog(false);
    setRejectOrderId(null);
    setRejectReason("");
  };

  const openRejectDialog = (orderId: string) => {
    setRejectOrderId(orderId);
    setShowRejectDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with test buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button onClick={playNotificationSound} size="sm" variant="outline">
            <Volume2 className="h-4 w-4 mr-2" />
            Test Sound
          </Button>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/10">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
          Live Updates
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: orders.filter(o => o.status === "pending").length, color: "text-amber-600" },
          { label: "Preparing", value: orders.filter(o => o.status === "preparing").length, color: "text-orange-600" },
          { label: "Ready", value: orders.filter(o => o.status === "ready").length, color: "text-green-600" },
          { label: "Today's Total", value: formatCurrency(orders.reduce((acc, o) => acc + Number(o.total || 0), 0)), color: "text-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-4 border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="mb-4">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  const isExpanded = expandedOrderId === order.id;
                  const isUpdating = loadingOrderId === order.id;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <div className="p-4 md:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Order Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold text-foreground font-mono text-sm">
                                #{order.id!.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge variant="outline" className={statusConfig.color}>
                                <statusConfig.icon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(order.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium text-foreground">Table {order.tableNumber}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                {order.customerName}
                              </span>
                              {order.customerPhone && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {order.customerPhone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-lg font-bold text-foreground">
                              {formatCurrency(order.total)}
                            </span>

                            {order.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateOrderStatus(order.id!, "accepted")}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openRejectDialog(order.id!)}
                                  disabled={isUpdating}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            {order.status === "accepted" && (
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={() => updateOrderStatus(order.id!, "preparing")}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <ChefHat className="h-4 w-4 mr-1" />
                                    Start Preparing
                                  </>
                                )}
                              </Button>
                            )}

                            {order.status === "preparing" && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateOrderStatus(order.id!, "ready")}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Ready
                                  </>
                                )}
                              </Button>
                            )}

                            {order.status === "ready" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id!, "served")}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Served
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleExpand(order.id!)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleToggleExpand(order.id!)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!["cancelled", "auto_cancelled", "served"].includes(order.status) && (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => openRejectDialog(order.id!)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-border pt-4 bg-muted/30">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Order Items</h4>
                                  {/* Check if items are directly in order or in separate state */}
                                  {(order.items?.length || orderItems[order.id!]?.length) ? (
                                    <div className="space-y-2">
                                      {(order.items || orderItems[order.id!]).map((item: any, i: number) => (
                                        <div key={item.id || i} className="flex justify-between text-sm">
                                          <span>
                                            {item.quantity}x {item.name}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ${(item.price * item.quantity).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No items found</p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Order Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Customer:</span> {order.customerName}</p>
                                    {order.customerPhone && (
                                      <p><span className="text-muted-foreground">Phone:</span> {order.customerPhone}</p>
                                    )}
                                    <p><span className="text-muted-foreground">Table:</span> #{order.tableNumber}</p>
                                    <p><span className="text-muted-foreground">Created:</span> {formatDate(order.createdAt)}</p>
                                    {order.notes && (
                                      <p><span className="text-muted-foreground">Notes:</span> {order.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Order Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for rejection (optional)</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Item out of stock, Kitchen closed..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will cancel the order and notify the customer. The customer's abuse score will be updated.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectOrder}
              disabled={loadingOrderId === rejectOrderId}
            >
              {loadingOrderId === rejectOrderId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

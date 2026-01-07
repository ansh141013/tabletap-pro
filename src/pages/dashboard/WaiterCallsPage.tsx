import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Filter,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { useWaiterCalls } from "@/hooks/useWaiterCalls";

export const WaiterCallsPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { waiterCalls, isLoading, dismissCall } = useWaiterCalls();

  const pendingCalls = waiterCalls.filter(call => call.status === "pending");
  const resolvedCalls = waiterCalls.filter(call => call.status === "resolved");

  const filteredCalls = activeTab === "pending" ? pendingCalls : resolvedCalls;

  const isUrgent = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const minutesElapsed = (now.getTime() - created.getTime()) / (1000 * 60);
    return minutesElapsed >= 5;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waiter Calls</h1>
          <p className="text-muted-foreground">
            {pendingCalls.length} pending call{pendingCalls.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
          <History className="h-4 w-4 mr-2" />
          View All History
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCalls.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Urgent (5+ min)</p>
          <p className="text-2xl font-bold text-red-600">
            {pendingCalls.filter(c => isUrgent(c.created_at)).length}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600">{resolvedCalls.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCalls.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedCalls.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading waiter calls...
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {activeTab} waiter calls</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredCalls.map((call, index) => {
                  const urgent = isUrgent(call.created_at);

                  return (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 md:p-5 ${urgent && call.status === "pending" ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            urgent && call.status === "pending"
                              ? "bg-red-100 dark:bg-red-900/50"
                              : call.status === "resolved"
                              ? "bg-green-100 dark:bg-green-900/50"
                              : "bg-amber-100 dark:bg-amber-900/50"
                          }`}>
                            {urgent && call.status === "pending" ? (
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                            ) : call.status === "resolved" ? (
                              <Check className="h-6 w-6 text-green-600" />
                            ) : (
                              <Bell className="h-6 w-6 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              Table {call.table_number}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(call.created_at)}
                              {urgent && call.status === "pending" && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {call.status === "pending" && (
                          <Button
                            onClick={() => dismissCall(call.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Dismiss
                          </Button>
                        )}

                        {call.status === "resolved" && call.resolved_at && (
                          <span className="text-sm text-muted-foreground">
                            Resolved {formatTime(call.resolved_at)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Waiter Call History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {waiterCalls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No waiter call history
              </p>
            ) : (
              waiterCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Table {call.table_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(call.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={call.status === "resolved" ? "secondary" : "default"}>
                    {call.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

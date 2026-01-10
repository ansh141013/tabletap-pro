import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createNotificationSound } from "@/utils/notificationSound";

export interface WaiterCall {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  table_number: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export function useWaiterCalls() {
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWaiterCalls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("waiter_calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWaiterCalls((data as WaiterCall[]) || []);
    } catch (error) {
      console.error("Error fetching waiter calls:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissCall = useCallback(async (callId: string) => {
    try {
      const { error } = await supabase
        .from("waiter_calls")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", callId);

      if (error) throw error;

      setWaiterCalls((prev) =>
        prev.map((call) =>
          call.id === callId ? { ...call, status: "resolved", resolved_at: new Date().toISOString() } : call
        )
      );

      toast({
        title: "Call dismissed",
        description: "Waiter call has been resolved.",
      });
    } catch (error) {
      console.error("Error dismissing call:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss waiter call",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchWaiterCalls();
  }, [fetchWaiterCalls]);

  // Real-time subscription
  useEffect(() => {
    const playSound = createNotificationSound();

    const channel = supabase
      .channel("waiter-calls-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_calls",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCall = payload.new as WaiterCall;
            setWaiterCalls((prev) => [newCall, ...prev]);

            // Play sound
            try {
              playSound();
            } catch (e) {
              console.error("Audio play failed", e);
            }

            toast({
              title: "🔔 Waiter Call!",
              description: `Table ${newCall.table_number} needs assistance`,
              duration: 10000,
            });
          } else if (payload.eventType === "UPDATE") {
            setWaiterCalls((prev) =>
              prev.map((call) =>
                call.id === payload.new.id ? (payload.new as WaiterCall) : call
              )
            );
          } else if (payload.eventType === "DELETE") {
            setWaiterCalls((prev) => prev.filter((call) => call.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    waiterCalls,
    isLoading,
    dismissCall,
    refetch: fetchWaiterCalls,
  };
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CallWaiterButtonProps {
  restaurantId: string;
  tableId: string | null;
  tableNumber: number;
}

export const CallWaiterButton = ({
  restaurantId,
  tableId,
  tableNumber,
}: CallWaiterButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(`lastWaiterCall_${restaurantId}_${tableNumber}`);
    return saved ? parseInt(saved) : null;
  });
  const [timeSince, setTimeSince] = useState<string>("");
  const { toast } = useToast();

  // Check rate limit on mount and interval
  useEffect(() => {
    const updateTime = () => {
      if (!lastCallTime) return;
      const diff = Date.now() - lastCallTime;
      if (diff < 120000) { // 2 mins
        // Still cooled down? No, diff < 2 mins means RECENT call.
        // Wait, logic:
        // If Diff < 2 mins, disabled.
      }

      const minutes = Math.floor(diff / 60000);
      if (minutes > 0 && minutes < 60) {
        setTimeSince(`Last called ${minutes}m ago`);
      } else if (minutes < 1) {
        setTimeSince("Just called");
      } else {
        setTimeSince("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastCallTime]);

  const isRateLimited = lastCallTime && (Date.now() - lastCallTime < 120000);

  const handleCallWaiter = async () => {
    if (isRateLimited) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from("waiter_calls").insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        status: "pending",
      });

      if (error) throw error;

      const now = Date.now();
      setLastCallTime(now);
      localStorage.setItem(`lastWaiterCall_${restaurantId}_${tableNumber}`, now.toString());
      setTimeSince("Just called");

      toast({
        title: "Waiter called",
        description: "A staff member will be with you shortly",
      });

    } catch (error: any) {
      toast({
        title: "Failed to call waiter",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        className={`bg-background shadow-sm ${isRateLimited ? 'opacity-80' : ''}`}
        onClick={handleCallWaiter}
        disabled={isLoading || isRateLimited}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRateLimited ? (
          <>
            <Check className="h-4 w-4 mr-1 text-green-500" />
            Waiter Notified
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-1" />
            Call Waiter
          </>
        )}
      </Button>
      {isRateLimited && timeSince && (
        <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full backdrop-blur">
          {timeSince}
        </span>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Check } from "lucide-react";
import { createWaiterCall } from "@/services/firebaseService";
import { useToast } from "@/hooks/use-toast";

interface CallWaiterButtonProps {
  restaurantId: string;
  tableId: string;
  tableNumber: string; // Changed to string to match Firebase Types
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

  useEffect(() => {
    const updateTime = () => {
      if (!lastCallTime) return;
      const diff = Date.now() - lastCallTime;

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

  const isRateLimited = lastCallTime ? (Date.now() - lastCallTime < 120000) : false;

  const handleCallWaiter = async () => {
    if (isRateLimited) return;
    setIsLoading(true);

    try {
      await createWaiterCall({
        restaurantId,
        tableId,
        tableNumber,
        type: 'service'
      });

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
        description: "Please try again",
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

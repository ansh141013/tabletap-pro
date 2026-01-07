import { useState } from "react";
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
  const [called, setCalled] = useState(false);
  const { toast } = useToast();

  const handleCallWaiter = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from("waiter_calls").insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        status: "pending",
      });

      if (error) throw error;

      setCalled(true);
      toast({
        title: "Waiter called",
        description: "A staff member will be with you shortly",
      });

      // Reset after 30 seconds
      setTimeout(() => setCalled(false), 30000);
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
    <Button
      variant="outline"
      size="sm"
      className="fixed top-4 right-4 z-50"
      onClick={handleCallWaiter}
      disabled={isLoading || called}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : called ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Called
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 mr-1" />
          Call Waiter
        </>
      )}
    </Button>
  );
};

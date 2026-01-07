import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Create notification sound using Web Audio API
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playSound = () => {
    // Create oscillators for a pleasant chime sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // First note (higher pitch)
    oscillator1.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator1.type = "sine";
    
    // Second note (harmony)
    oscillator2.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
    oscillator2.type = "sine";
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.12);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.4);
    oscillator2.stop(audioContext.currentTime + 0.4);
  };

  return playSound;
};

interface Order {
  id: string;
  table_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

export function useOrderNotifications(onNewOrder?: (order: Order) => void) {
  const { toast } = useToast();
  const playSoundRef = useRef<(() => void) | null>(null);
  const hasInteracted = useRef(false);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!playSoundRef.current) {
        playSoundRef.current = createNotificationSound();
      }
      hasInteracted.current = true;
    };

    // Listen for any user interaction to unlock audio
    const events = ["click", "touchstart", "keydown"];
    events.forEach((event) => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (playSoundRef.current && hasInteracted.current) {
      try {
        playSoundRef.current();
      } catch (error) {
        console.log("Could not play notification sound:", error);
      }
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as Order;
          
          // Play sound
          playNotificationSound();
          
          // Show toast notification
          toast({
            title: "🔔 New Order!",
            description: `Table ${newOrder.table_number} - ${newOrder.customer_name} ($${newOrder.total?.toFixed(2) || "0.00"})`,
            duration: 5000,
          });

          // Call callback if provided
          if (onNewOrder) {
            onNewOrder(newOrder);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          const oldOrder = payload.old as Order;

          // Notify on status change
          if (oldOrder.status !== updatedOrder.status) {
            toast({
              title: `Order Updated`,
              description: `Table ${updatedOrder.table_number}: ${oldOrder.status} → ${updatedOrder.status}`,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, playNotificationSound, onNewOrder]);

  return { playNotificationSound };
}

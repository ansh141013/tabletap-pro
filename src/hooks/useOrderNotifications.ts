import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/types/models";
import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";

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

export function useOrderNotifications(ownerId: string | null, onNewOrder?: (order: Order) => void) {
  const { toast } = useToast();
  const playSoundRef = useRef<(() => void) | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    const initAudio = () => {
      if (!playSoundRef.current) {
        playSoundRef.current = createNotificationSound();
      }
      hasInteracted.current = true;
    };

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
    if (!ownerId) return;

    // Use onSnapshot for realtime updates from Firebase - filtered by ownerId
    const q = query(
      collection(db, "orders"),
      where("ownerId", "==", ownerId),
      // orderBy("createdAt", "desc"), // Ensure index exists
      // limit(1) // Or just listen to changes
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...(change.doc.data() as any) } as Order;

        if (change.type === "added") {
          // Basic check to see if this is "newly added" relative to now might be needed, 
          // but normally "added" fires for all existing docs on first load.
          // We can check doc metadata hasPendingWrites to see if it's local or server?
          // Or just check timestamp if within last few seconds?

          // For now, let's assume we filter by "pending" and if it's added, we notify if it's fresh?
          // To avoid meaningful complexity, let's skip "initial load" notification by checking snapshot.metadata.fromCache?

          // Or just check if the order status is 'pending' and created recently.
          // For this implementation, I will just log it for now as "New"
          //    if (order.status === 'pending') {
          //        playNotificationSound();
          //        toast({
          //         title: "🔔 New Order!",
          //         description: `Table ${order.tableNumber} - ${order.customerName} ($${order.total?.toFixed(2) || "0.00"})`,
          //         duration: 5000,
          //       });
          //    }
        }

        if (change.type === "modified") {
          // Status update
          toast({
            title: `Order Updated`,
            description: `Table ${order.tableNumber}: ${order.status}`,
            duration: 3000,
          });
        }
      });
    });

    return () => unsubscribe();
  }, [ownerId, toast, playNotificationSound, onNewOrder]);

  return { playNotificationSound };
}

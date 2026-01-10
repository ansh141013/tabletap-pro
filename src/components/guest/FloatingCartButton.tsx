import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface FloatingCartButtonProps {
    count: number;
    onClick: () => void;
}

export const FloatingCartButton = ({ count, onClick }: FloatingCartButtonProps) => {
    if (count === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                key={count} // Trigger animation on count change
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 relative"
                    onClick={onClick}
                >
                    <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                    <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-background">
                        {count}
                    </span>
                    {/* Ripple effect or pulse could be added via CSS animation classes if needed */}
                </Button>
            </motion.div>
        </AnimatePresence>
    );
};

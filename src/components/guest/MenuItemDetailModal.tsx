import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { MenuItem } from "@/pages/GuestMenu";

interface MenuItemDetailModalProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (item: MenuItem, quantity: number, notes?: string) => void;
    currency: string;
}

export const MenuItemDetailModal = ({ item, isOpen, onClose, onAddToCart, currency }: MenuItemDetailModalProps) => {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setNotes("");
        }
    }, [isOpen, item]);

    if (!item) return null;

    const handleAddToCart = () => {
        onAddToCart(item, quantity, notes);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-card">
                <div className="relative h-48 w-full bg-muted">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                            No Image
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
                        <div className="text-lg font-semibold text-primary mt-1">
                            {currency} {item.price.toFixed(2)}
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm">
                        {item.description || "No description available."}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between pt-4">
                        <span className="font-medium">Quantity</span>
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Notes (Optional - could add text area if needed, simplified for now as per prompt "Add extras/customizations (if implemented)") */}

                    <Button className="w-full h-12 text-lg mt-4" onClick={handleAddToCart}>
                        Add to Order - {currency} {(item.price * quantity).toFixed(2)}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

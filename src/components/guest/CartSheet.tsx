import { useState } from "react";
import { CartItem } from "@/pages/GuestMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartSheetProps {
  cart: CartItem[];
  currency: string;
  total: number;
  restaurantId: string;
  tableId: string | null;
  tableNumber: number | null;
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onClearCart: () => void;
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
};

export const CartSheet = ({
  cart,
  currency,
  total,
  restaurantId,
  tableId,
  tableNumber,
  onUpdateItem,
  onClearCart,
}: CartSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { toast } = useToast();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to place the order",
        variant: "destructive",
      });
      return;
    }

    if (!tableNumber) {
      toast({
        title: "Table not found",
        description: "Please scan the QR code at your table",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          table_number: tableNumber,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          notes: orderNotes.trim() || null,
          total: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderPlaced(true);
      onClearCart();
      setCustomerName("");
      setCustomerPhone("");
      setOrderNotes("");

      toast({
        title: "Order placed!",
        description: "Your order has been sent to the kitchen",
      });

      // Reset after showing success
      setTimeout(() => {
        setOrderPlaced(false);
        setIsOpen(false);
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Failed to place order",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Fixed bottom cart button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="w-full" size="lg" disabled={cart.length === 0}>
              <ShoppingCart className="h-5 w-5 mr-2" />
              View Cart ({itemCount})
              <span className="ml-auto">{formatPrice(total, currency)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col">
            <SheetHeader>
              <SheetTitle>Your Order</SheetTitle>
            </SheetHeader>

            {orderPlaced ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Order Placed!</h3>
                  <p className="text-muted-foreground">
                    Your order has been sent to the kitchen
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      {/* Cart items */}
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.price, currency)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => onUpdateItem(item.id, 0)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Customer info */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Your Name *</Label>
                          <Input
                            id="customerName"
                            placeholder="Enter your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone">Phone (optional)</Label>
                          <Input
                            id="customerPhone"
                            placeholder="Enter your phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orderNotes">Special requests</Label>
                          <Textarea
                            id="orderNotes"
                            placeholder="Any allergies or special requests?"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {cart.length > 0 && (
                  <SheetFooter className="border-t pt-4">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>{formatPrice(total, currency)}</span>
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || !tableNumber}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          "Place Order"
                        )}
                      </Button>
                    </div>
                  </SheetFooter>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

import { MenuItem } from "@/pages/GuestMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface MenuItemsListProps {
  items: MenuItem[];
  currency: string;
  onAddToCart: (item: MenuItem) => void;
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
};

export const MenuItemsList = ({ items, currency, onAddToCart }: MenuItemsListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items available in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-4">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-24 h-24 object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 py-3 pr-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-primary">
                    {formatPrice(item.price, currency)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onAddToCart(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

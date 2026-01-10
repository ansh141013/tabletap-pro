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

export const MenuItemsList = ({ items, currency, onAddToCart, onItemClick }: { items: MenuItem[], currency: string, onAddToCart: (item: MenuItem, e: React.MouseEvent) => void, onItemClick: (item: MenuItem) => void }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items available in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative group"
          onClick={() => item.available && onItemClick(item)}
        >
          {/* Unavailable Overlay */}
          {!item.available && (
            <div className="absolute inset-0 bg-background/80 z-20 flex items-center justify-center">
              <span className="font-bold text-muted-foreground border-2 border-muted-foreground px-4 py-1 rounded-full transform -rotate-12">
                SOLD OUT
              </span>
            </div>
          )}

          <CardContent className="p-0 h-full flex flex-col">
            <div className="relative h-48 w-full bg-muted">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/50">No Image</div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                  {item.description || "No description available."}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 bg-muted/30 p-2 -mx-2 -mb-2 rounded-b-lg">
                <span className="font-bold text-primary text-lg">
                  {formatPrice(item.price, currency)}
                </span>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item, e);
                  }}
                  className="rounded-full h-9 w-9 p-0 shadow-sm"
                  disabled={!item.available}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

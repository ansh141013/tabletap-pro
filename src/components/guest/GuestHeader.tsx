import { Restaurant } from "@/types/models";

interface GuestHeaderProps {
  restaurant: Restaurant;
  tableNumber: string | number | null;
}

export const GuestHeader = ({ restaurant, tableNumber }: GuestHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{restaurant.name}</h1>
            {tableNumber && (
              <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

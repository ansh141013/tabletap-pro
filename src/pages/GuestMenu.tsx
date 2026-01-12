import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { GuestHeader } from "@/components/guest/GuestHeader";
import { MenuCategories } from "@/components/guest/MenuCategories";
import { MenuItemsList } from "@/components/guest/MenuItemsList";
import { CallWaiterButton } from "@/components/guest/CallWaiterButton";
import { MenuSearch } from "@/components/guest/MenuSearch";
import { OrderTracker } from "@/components/guest/OrderTracker";
import { Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { MenuItemDetailModal } from "@/components/guest/MenuItemDetailModal";
import { FloatingCartButton } from "@/components/guest/FloatingCartButton";
import { getRestaurant, getTable, getCategories, getMenuItems } from "@/services/firebaseService";
import { Restaurant, Category, MenuItem } from "@/types/models";

const GuestMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { cart, addToCart, totalItems } = useCart(restaurantId, tableId);

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) {
        setError("Restaurant not found");
        setLoading(false);
        return;
      }

      try {
        const rest = await getRestaurant(restaurantId);
        if (!rest) {
          setError("Restaurant not found");
          setLoading(false);
          return;
        }

        setRestaurant(rest);

        if (tableId) {
          const tableData = await getTable(tableId);
          if (tableData) {
            setTableNumber(tableData.number);
          }
        }

        const cats = await getCategories(restaurantId);
        setCategories(cats);

        const items = await getMenuItems(restaurantId);
        setMenuItems(items);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load menu");
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, tableId]);


  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.imageUrl
    });
    toast({
      title: "Added to cart",
      description: `${item.name} (+1)`,
      duration: 1500,
    });
  };

  const handleModalAdd = (item: MenuItem, quantity: number, notes?: string) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      notes: notes,
      image_url: item.imageUrl
    });
    toast({
      title: "Added to cart",
      description: `${item.name} (${quantity})`,
    });
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    } else if (selectedCategory) {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }
    return items;
  }, [menuItems, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Oops!</h1>
          <p className="text-muted-foreground">{error || "Something went wrong"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <GuestHeader
        restaurant={restaurant}
        tableNumber={tableNumber ? parseInt(tableNumber) : null} // Parse if needed or update GuestHeader
      />

      <div className="container max-w-5xl mx-auto px-4 py-4">
        {tableNumber && (
          <OrderTracker
            restaurantId={restaurantId!}
            tableNumber={parseInt(tableNumber)} // Parse int
            currency={restaurant.currency || "USD"}
          />
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <MenuSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
        </div>

        {!searchQuery && (
          <MenuCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {searchQuery && filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items match "{searchQuery}"</p>
          </div>
        ) : (
          <MenuItemsList
            items={filteredItems}
            currency={restaurant.currency || "USD"}
            onAddToCart={handleQuickAdd}
            onItemClick={(item) => {
              setSelectedItem(item);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      <FloatingCartButton
        count={totalItems}
        onClick={() => navigate(`/menu/${restaurantId}/cart${tableId ? `?table=${tableId}` : ''}`)}
      />

      <MenuItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleModalAdd}
        currency={restaurant.currency || "USD"}
      />

      {tableNumber && restaurantId && (
        <CallWaiterButton
          restaurantId={restaurantId}
          tableId={tableId!}
          tableNumber={tableNumber}
        />
      )}
    </div>
  );
};

export default GuestMenu;

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

// Exports shared types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  available: boolean;
}

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
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cart Hook
  const { cart, addToCart, totalItems } = useCart(restaurantId, tableId);

  // Fetch Logic
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) {
        setError("Restaurant not found");
        setLoading(false);
        return;
      }

      try {
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, logo_url, currency")
          .eq("id", restaurantId)
          .eq("setup_complete", true)
          .single();

        if (restaurantError || !restaurantData) {
          setError("Restaurant not found or not available");
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Fetch table info if tableId provided
        if (tableId) {
          const { data: tableData } = await supabase
            .from("tables")
            .select("table_number")
            .eq("id", tableId)
            .eq("restaurant_id", restaurantId)
            .single();

          if (tableData) {
            setTableNumber(tableData.table_number);
          }
        }

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("sort_order", { ascending: true });

        setCategories(categoriesData || []);
        // Don't auto select category, allow "All" (null) to be default

        // Fetch menu items
        const { data: menuData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("available", true);

        setMenuItems(menuData || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load menu");
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, tableId]);

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    // Add animation trigger here if needed (e.g. flying element)
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url
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
      image_url: item.image_url
    });
    toast({
      title: "Added to cart",
      description: `${item.name} (${quantity})`,
    });
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    } else if (selectedCategory) {
      // Only filter by category if not searching and category is selected
      items = items.filter((item) => item.category_id === selectedCategory);
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
        tableNumber={tableNumber}
      />

      <div className="container max-w-5xl mx-auto px-4 py-4">
        {tableNumber && (
          <OrderTracker
            restaurantId={restaurantId!}
            tableNumber={tableNumber}
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
          tableId={tableId}
          tableNumber={tableNumber}
        />
      )}
    </div>
  );
};

export default GuestMenu;

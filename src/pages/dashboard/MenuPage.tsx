
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Using sonner as seen in other files

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url?: string | null;
  available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
  isOpen?: boolean;
}

export const MenuPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States (Item)
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);

  // Form States (Category)
  const [newCategoryName, setNewCategoryName] = useState("");

  const isDevMode = sessionStorage.getItem('devMode') === 'true';

  useEffect(() => {
    if (isDevMode) {
      // Mock Data
      setRestaurantId("mock-restaurant-id");
      setCategories([
        {
          id: "1", name: "Mock Appetizers", isOpen: true,
          items: [
            { id: "101", name: "Mock Fries", description: "Crispy", price: 5.99, available: true, category_id: "1" },
            { id: "102", name: "Mock Wings", description: "Spicy", price: 12.99, available: false, category_id: "1" }
          ]
        },
        {
          id: "2", name: "Mock Mains", isOpen: false,
          items: [
            { id: "201", name: "Mock Burger", description: "Juicy", price: 15.99, available: true, category_id: "2" }
          ]
        }
      ]);
      setIsLoading(false);
      return;
    }

    if (!user) return;

    const fetchMenuData = async () => {
      try {
        // 1. Get Restaurant ID
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!restaurant) throw new Error("Restaurant not found");
        setRestaurantId(restaurant.id);

        // 2. Get Categories
        const { data: catsData, error: catsError } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .order("sort_order", { ascending: true });

        if (catsError) throw catsError;

        // 3. Get Items
        const { data: itemsData, error: itemsError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurant.id);

        if (itemsError) throw itemsError;

        // 4. Merge
        const mergedCategories: Category[] = (catsData || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          isOpen: true, // Default open
          items: (itemsData || [])
            .filter(item => item.category_id === cat.id)
            .map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              image_url: item.image_url,
              available: item.available ?? true,
              category_id: item.category_id
            }))
        }));

        setCategories(mergedCategories);
      } catch (error: any) {
        console.error("Error loading menu:", error);
        toast.error("Failed to load menu: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();

  }, [user, isDevMode]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
      )
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    setIsSubmitting(true);

    try {
      if (isDevMode) {
        setCategories([...categories, { id: `mock-cat-${Date.now()}`, name: newCategoryName, items: [], isOpen: true }]);
        toast.success("Mock category created");
      } else {
        if (!restaurantId) return;
        const { error } = await supabase.from("categories").insert({
          restaurant_id: restaurantId,
          name: newCategoryName,
          sort_order: categories.length
        });
        if (error) throw error;
        toast.success("Category created");
        // Reload page or refetch logic here... simpler to reload for now or optimistic update
        window.location.reload();
      }
      setIsAddCategoryDialogOpen(false);
      setNewCategoryName("");
    } catch (error: any) {
      toast.error("Failed to create category: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName || !newItemPrice || !newItemCategory) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = null;

      if (isDevMode) {
        toast.success("Mock item created");
        // Update local state for immediate feedback
      } else {
        if (!restaurantId) return;

        // Image Upload
        if (newItemImage) {
          const fileExt = newItemImage.name.split('.').pop();
          const fileName = `${restaurantId}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('menu-items') // Ensure this bucket exists in Phase 1
            .upload(fileName, newItemImage);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('menu-items')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }

        const { error } = await supabase.from("menu_items").insert({
          restaurant_id: restaurantId,
          category_id: newItemCategory,
          name: newItemName,
          description: newItemDescription,
          price: parseFloat(newItemPrice),
          image_url: imageUrl,
          available: true
        });

        if (error) throw error;
        toast.success("Item created successfully");
        window.location.reload(); // Simple refresh for now
      }

      setIsAddItemDialogOpen(false);
      // Reset form
      setNewItemName("");
      setNewItemDescription("");
      setNewItemPrice("");
      setNewItemCategory("");
      setNewItemImage(null);

    } catch (error: any) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async (item: MenuItem) => {
    if (isDevMode) {
      toast.success("Mock availability toggled");
      // Local update logic...
      return;
    }

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ available: !item.available })
        .eq("id", item.id);

      if (error) throw error;

      // Optimistic update
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(i => i.id === item.id ? { ...i, available: !i.available } : i)
      })));

      toast.success(`Item marked as ${!item.available ? "available" : "unavailable"}`);

    } catch (error: any) {
      toast.error("Failed to update availability");
    }
  };

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const availableCount = categories.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.available).length,
    0
  );

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {/* Add Category Dialog */}
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription>Create a new menu category.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Salads"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Item Dialog */}
          <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>Add a new item to your menu.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Grilled Chicken"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setNewItemImage(e.target.files[0]);
                      }}
                    />
                    {newItemImage ? (
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden mb-2">
                          <img src={URL.createObjectURL(newItemImage)} className="h-full w-full object-cover" />
                        </div>
                        <p className="text-sm truncate max-w-[200px]">{newItemImage.name}</p>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.preventDefault();
                          setNewItemImage(null);
                        }}>Remove</Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateItem} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-foreground">{totalItems}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-success">{availableCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Unavailable</p>
          <p className="text-2xl font-bold text-destructive">{totalItems - availableCount}</p>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="space-y-4">
        {categories.map((category, catIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.05 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <Collapsible open={category.isOpen} onOpenChange={() => toggleCategory(category.id)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                    {category.isOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                    <Badge variant="secondary">{category.items.length} items</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Category
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border divide-y divide-border">
                  {category.items
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{item.name}</h4>
                              {!item.available && (
                                <Badge variant="outline" className="text-destructive border-destructive/20">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">
                            ${item.price.toFixed(2)}
                          </span>
                          <Switch
                            checked={item.available}
                            onCheckedChange={() => handleAvailabilityToggle(item)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  {category.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No items found inside {category.name}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

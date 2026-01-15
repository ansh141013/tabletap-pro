import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  FileDown,
  UtensilsCrossed,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getCategories,
  getMenuItems,
  getDashboardCategories,
  getDashboardMenuItems,
  addCategory,
  addMenuItem,
  updateCategory,
  updateMenuItem,
  deleteCategory,
  deleteMenuItem,
  uploadMenuItemImage
} from "@/services/firebaseService";
import { Category, MenuItem } from "@/types/models";

import { handleFirestoreError, getFirestoreErrorMessage } from "@/utils/firestoreErrors";
import { usePlan, useLimit } from "@/contexts/PlanContext";
import { useNavigate } from "react-router-dom";

// Helper interface to add UI state
interface UICategory extends Category {
  isOpen?: boolean;
  items: MenuItem[];
}

// ─────────────────────────────────────────────────────────────
// SKELETON LOADING COMPONENT
// ─────────────────────────────────────────────────────────────
const MenuPageSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>

    {/* Stats Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>

    {/* Categories Skeleton */}
    <div className="space-y-4">
      {[1, 2].map((catIndex) => (
        <div key={catIndex} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="border-t border-border divide-y divide-border">
            {[1, 2, 3].map((itemIndex) => (
              <div key={itemIndex} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  onAddCategory: () => void;
}

const MenuEmptyState = ({ onAddCategory }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <UtensilsCrossed className="h-10 w-10 text-primary" />
    </div>
    <h2 className="text-2xl font-bold text-foreground mb-2">Your menu is empty</h2>
    <p className="text-muted-foreground text-center max-w-md mb-8">
      Start by creating categories to organize your menu, then add delicious items for your customers to order.
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button onClick={onAddCategory} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Add Your First Category
      </Button>
      <Button variant="outline" size="lg" className="gap-2">
        <Info className="h-5 w-5" />
        Learn How It Works
      </Button>
    </div>
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-2xl">
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-primary mb-1">1</div>
        <p className="text-sm text-muted-foreground">Create categories like "Appetizers", "Mains", "Drinks"</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-primary mb-1">2</div>
        <p className="text-sm text-muted-foreground">Add menu items with name, price, and photo</p>
      </div>
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="text-2xl font-bold text-primary mb-1">3</div>
        <p className="text-sm text-muted-foreground">Toggle availability anytime with one click</p>
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// SEARCH EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────
interface SearchEmptyProps {
  query: string;
  onClear: () => void;
}

const SearchEmptyState = ({ query, onClear }: SearchEmptyProps) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-1">No results found</h3>
    <p className="text-muted-foreground text-center mb-4">
      No menu items match "<span className="font-medium text-foreground">{query}</span>"
    </p>
    <Button variant="outline" onClick={onClear}>
      Clear Search
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// ERROR STATE COMPONENT
// ─────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const MenuErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load menu</h3>
    <p className="text-muted-foreground text-center max-w-md mb-6">{message}</p>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN MENU PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export const MenuPage = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);


  // Computed values needed for hooks
  const totalItems = useMemo(() =>
    allItems.length,
    [allItems]
  );

  // Plan limits check
  const {
    limit: catLimit,
    reached: catLimitReached,
    canUpgrade: canUpgradeCat
  } = useLimit('maxCategories', categories.length);

  const {
    limit: itemLimit,
    reached: itemLimitReached,
    canUpgrade: canUpgradeItem
  } = useLimit('maxMenuItems', totalItems);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSetupState, setIsSetupState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form States (Category)
  const [newCategoryName, setNewCategoryName] = useState("");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    // -------------------------------------------------------------
    // FORCE HARD LOGGING - DEBUG MENU LOAD
    // -------------------------------------------------------------
    const authState = {
      isAuthLoading: loading,
      hasUser: !!user,
      authUid: user?.uid,
      hasProfile: !!userProfile,
      restaurantId: userProfile?.restaurantId,
    };

    console.group('[MenuPage] fetchData Execution');
    console.log('1. Auth State Check:', authState);

    // GUARD: Block query if dependencies are missing
    if (loading || !user || !userProfile?.restaurantId) {
      console.warn('2. Context not ready. Aborting query.');
      console.groupEnd();
      return;
    }

    const ownerId = user.uid;
    const restaurantId = userProfile.restaurantId;

    console.log('3. Query Parameters Prepared:', {
      ownerId,
      restaurantId,
      filters: ['ownerId == ' + ownerId, 'restaurantId == ' + restaurantId],
      orderBy: ['createdAt desc (menuItems)', 'displayOrder asc (categories)']
    });

    setIsLoading(true);
    setLoadError(null);

    try {
      console.time('Firestore Fetch Duration');

      const [cats, items] = await Promise.all([
        getDashboardCategories(ownerId, restaurantId),
        getDashboardMenuItems(ownerId, restaurantId)
      ]);

      console.timeEnd('Firestore Fetch Duration');
      console.log('4. Fetch Success:', {
        categoriesCount: cats.length,
        menuItemsCount: items.length
      });

      // Transform Data
      const merged: UICategory[] = cats.map(cat => ({
        ...cat,
        isOpen: true,
        items: items.filter(i => i.categoryId === cat.id)
      }));

      // Set State
      setAllItems(items);
      setCategories(merged);

      console.log('5. State Updated. Rendering...');

    } catch (err: any) {
      console.error('CRITICAL: Menu Loading Failed');
      console.error('Error Object:', err);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);

      if (err.code === 'failed-precondition') {
        console.error('CAUSE: Missing Composite Index.');
        console.error('ACTION: Check the Firebase Console link in the error message above to build the index.');
      }

      const errorResult = handleFirestoreError(err, "Loading menu");

      setLoadError(errorResult.userMessage);
      toast.error(errorResult.userMessage);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [user, userProfile?.restaurantId, loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
      )
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !user?.uid || !userProfile?.restaurantId) return;
    setIsSubmitting(true);

    try {
      await addCategory({
        ownerId: user.uid,
        restaurantId: userProfile.restaurantId,
        name: newCategoryName,
        displayOrder: categories.length
      });
      toast.success("Category created");
      fetchData();
      setNewCategoryName("");
      setIsAddCategoryDialogOpen(false);
    } catch (error: any) {
      const errorMessage = getFirestoreErrorMessage(error, "Creating category");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast.success("Category deleted");
      fetchData();
    } catch (error: any) {
      const errorMessage = getFirestoreErrorMessage(error, "Deleting category");
      toast.error(errorMessage);
    }
  };

  const handleDuplicateItem = async (item: MenuItem) => {
    if (!user?.uid || !userProfile?.restaurantId) return;
    try {
      const newName = `${item.name} (Copy)`;
      await addMenuItem({
        ownerId: user.uid,
        restaurantId: userProfile.restaurantId,
        categoryId: item.categoryId,
        name: newName,
        description: item.description || "",
        price: item.price,
        imageUrl: item.imageUrl || "",
        available: item.available
      });

      toast.success("Item duplicated successfully");
      fetchData();
    } catch (error: any) {
      const errorMessage = getFirestoreErrorMessage(error, "Duplicating item");
      toast.error(errorMessage);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setNewItemName(item.name);
    setNewItemDescription(item.description || "");
    setNewItemPrice(item.price.toString());
    setNewItemCategory(item.categoryId);
    setEditingItem(item);
    setIsAddItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!newItemName || !newItemPrice || !newItemCategory || !user?.uid || !userProfile?.restaurantId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = editingItem?.imageUrl || "";

      if (newItemImage) {
        imageUrl = await uploadMenuItemImage(newItemImage, userProfile.restaurantId);
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id!, {
          categoryId: newItemCategory,
          name: newItemName,
          description: newItemDescription,
          price: parseFloat(newItemPrice),
          imageUrl: imageUrl,
        });
        toast.success("Item updated successfully");
      } else {
        await addMenuItem({
          ownerId: user.uid,
          restaurantId: userProfile.restaurantId,
          categoryId: newItemCategory,
          name: newItemName,
          description: newItemDescription,
          price: parseFloat(newItemPrice),
          imageUrl: imageUrl,
          available: true,
        });
        toast.success("Item created successfully");
      }

      fetchData();
      setIsAddItemDialogOpen(false);

      // Reset form
      setNewItemName("");
      setNewItemDescription("");
      setNewItemPrice("");
      setNewItemCategory("");
      setNewItemImage(null);
      setEditingItem(null);

    } catch (error: any) {
      console.error("Error saving item:", error);
      const errorMessage = getFirestoreErrorMessage(error, "Saving item");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async (item: MenuItem) => {
    try {
      // Optimistic update
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(i => i.id === item.id ? { ...i, available: !i.available } : i)
      })));

      await updateMenuItem(item.id!, { available: !item.available });
      toast.success(`Item marked as ${!item.available ? "available" : "unavailable"}`);
    } catch (error: any) {
      const errorMessage = getFirestoreErrorMessage(error, "Updating availability");
      toast.error(errorMessage);
      fetchData(); // Revert on error
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      toast.success("Item deleted");
      fetchData();
    } catch (err: any) {
      const errorMessage = getFirestoreErrorMessage(err, "Deleting item");
      toast.error(errorMessage);
    }
  };

  // Computed values
  // totalItems moved up for hook usage

  const availableCount = useMemo(() =>
    categories.reduce((acc, cat) => acc + cat.items.filter(item => item.available).length, 0),
    [categories]
  );

  const unavailableCount = totalItems - availableCount;

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!debouncedSearch) return categories;

    return categories.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  }, [categories, debouncedSearch]);

  const hasSearchResults = debouncedSearch ? filteredCategories.some(cat => cat.items.length > 0) : true;
  const isEmptyMenu = categories.length === 0 && totalItems === 0;
  const hasCategories = categories.length > 0;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return <MenuPageSkeleton />;
  }

  if (loadError) {
    return <MenuErrorState message={loadError} onRetry={fetchData} />;
  }

  if (isEmptyMenu) {
    return (
      <>
        <MenuEmptyState onAddCategory={() => setIsAddCategoryDialogOpen(true)} />
        {/* Category Dialog - needed even in empty state */}
        <Dialog open={isAddCategoryDialogOpen} onOpenChange={(open) => {
          if (open && catLimitReached) {
            toast.error(
              `You reached the ${catLimit} category limit on your plan.`,
              {
                action: canUpgradeCat ? {
                  label: "Upgrade",
                  onClick: () => navigate('/dashboard/upgrade')
                } : undefined
              }
            );
            return;
          }
          setIsAddCategoryDialogOpen(open);
        }}>
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
                  placeholder="e.g., Appetizers"
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
      </>
    );
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
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={(open) => {
            if (open && catLimitReached) {
              toast.error(
                `You reached the ${catLimit} category limit on your plan.`,
                {
                  action: canUpgradeCat ? {
                    label: "Upgrade",
                    onClick: () => navigate('/dashboard/upgrade')
                  } : undefined
                }
              );
              return;
            }
            setIsAddCategoryDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button variant={hasCategories ? "outline" : "default"} disabled={catLimitReached}>
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
          <Dialog open={isAddItemDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
              setNewItemName("");
              setNewItemDescription("");
              setNewItemPrice("");
              setNewItemCategory("");
              setNewItemImage(null);
            }
            if (open && !editingItem && itemLimitReached) {
              toast.error(
                `You reached the ${itemLimit} menu item limit on your plan.`,
                {
                  action: canUpgradeItem ? {
                    label: "Upgrade",
                    onClick: () => navigate('/dashboard/upgrade')
                  } : undefined
                }
              );
              return;
            }
            setIsAddItemDialogOpen(open);
          }}>
            {hasCategories ? (
              <DialogTrigger asChild>
                <Button disabled={itemLimitReached}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a category first</p>
                </TooltipContent>
              </Tooltip>
            )}
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                <DialogDescription>{editingItem ? "Update existing item details." : "Add a new item to your menu."}</DialogDescription>
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
                      aria-label="Select Category"
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
                      aria-label="Upload item image"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setNewItemImage(e.target.files[0]);
                      }}
                    />
                    {newItemImage ? (
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden mb-2">
                          <img src={URL.createObjectURL(newItemImage)} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-sm truncate max-w-[200px]">{newItemImage.name}</p>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.preventDefault();
                          setNewItemImage(null);
                        }}>Remove</Button>
                      </div>
                    ) : editingItem?.imageUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden mb-2">
                          <img src={editingItem.imageUrl} alt="Current" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-sm text-muted-foreground">Current Image. Upload new to replace.</p>
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
                <Button onClick={handleSaveItem} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingItem ? "Update Item" : "Add Item")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Categories</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalItems}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Available</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{availableCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-muted-foreground">Unavailable</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{unavailableCount}</p>
        </div>
      </div>

      {/* Search Empty State */}
      {debouncedSearch && !hasSearchResults && (
        <SearchEmptyState query={debouncedSearch} onClear={() => setSearchQuery("")} />
      )}

      {/* Categories and Items */}
      {hasSearchResults && (
        <div className="space-y-4">
          {filteredCategories.map((category, catIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <Collapsible open={category.isOpen} onOpenChange={() => toggleCategory(category.id!)}>
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
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category.id!)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border divide-y divide-border">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
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
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Duplicate Item
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id!)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    {category.items.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No items in this category yet</p>
                        <Button
                          variant="link"
                          className="mt-2"
                          onClick={() => {
                            setNewItemCategory(category.id!);
                            setIsAddItemDialogOpen(true);
                          }}
                        >
                          Add your first item
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
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
  FileDown
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getCategories, getMenuItems, addCategory, addMenuItem, updateMenuItem, deleteMenuItem, deleteCategory, uploadMenuItemImage } from "@/services/firebaseService";
import { Category, MenuItem } from "@/types/models";

// Helper interface to add UI state
interface UICategory extends Category {
  isOpen?: boolean;
  items: MenuItem[];
}

export const MenuPage = () => {
  const { userProfile } = useAuth();
  const [categories, setCategories] = useState<UICategory[]>([]);
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
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form States (Category)
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    if (!userProfile?.restaurantId) return;
    try {
      const [cats, items] = await Promise.all([
        getCategories(userProfile.restaurantId),
        getMenuItems(userProfile.restaurantId)
      ]);

      const merged: UICategory[] = cats.map(cat => ({
        ...cat,
        isOpen: true,
        items: items.filter(i => i.categoryId === cat.id)
      }));
      setCategories(merged);
    } catch (err: any) {
      toast.error("Failed to load menu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
      )
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !userProfile?.restaurantId) return;
    setIsSubmitting(true);

    try {
      await addCategory({
        restaurantId: userProfile.restaurantId,
        name: newCategoryName,
        displayOrder: categories.length
      });
      toast.success("Category created");
      fetchData();
      setNewCategoryName("");
      setIsAddCategoryDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to create category: " + error.message);
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
      toast.error("Failed to delete category");
    }
  };

  const handleDuplicateItem = async (item: MenuItem) => {
    if (!userProfile?.restaurantId) return;
    try {
      const newName = `${item.name} (Copy)`;
      await addMenuItem({
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
      toast.error("Failed to duplicate item: " + error.message);
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
    if (!newItemName || !newItemPrice || !newItemCategory || !userProfile?.restaurantId) {
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
      toast.error("Failed to save item: " + error.message);
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
      toast.error("Failed to update availability");
      fetchData(); // Revert on error
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      toast.success("Item deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete item: " + err.message);
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
          <Dialog open={isAddItemDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
              setNewItemName("");
              setNewItemDescription("");
              setNewItemPrice("");
              setNewItemCategory("");
              setNewItemImage(null);
            }
            setIsAddItemDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
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
                  {category.items
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
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

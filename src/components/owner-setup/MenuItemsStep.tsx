import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Utensils, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Category, MenuItem } from "@/types/models";
import { addMenuItem, deleteMenuItem, updateMenuItem } from "@/services/firebaseService"; // Use Firebase

interface MenuItemsStepProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  categories: Category[];
  restaurantId: string;
}

export const MenuItemsStep = ({ menuItems, setMenuItems, categories, restaurantId }: MenuItemsStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    available: true,
  });

  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: categories[0]?.id || "",
      imageUrl: "",
      available: true,
    });
  };

  const openAddDialog = () => {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || "",
      available: item.available,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Image upload stub if needed, though we use URL for now
  /*
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ...
  };
  */

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: "Valid price is required", variant: "destructive" });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const itemData = {
      restaurantId,
      categoryId: formData.categoryId,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl,
      available: formData.available,
    };

    if (editingItem) {
      try {
        await updateMenuItem(editingItem.id!, itemData);
        setMenuItems(
          menuItems.map((item) =>
            item.id === editingItem.id
              ? { ...item, ...itemData }
              : item
          )
        );
        toast({ title: "Menu item updated!" });
      } catch (e) {
        toast({ title: "Failed to update item", variant: "destructive" });
      }
    } else {
      try {
        const ref = await addMenuItem(itemData);
        setMenuItems([
          ...menuItems,
          {
            id: ref.id,
            ...itemData,
            createdAt: new Date() // Stub for local update, DB has serverTimestamp
          },
        ]);
        toast({ title: "Menu item added!" });
      } catch (e) {
        toast({ title: "Failed to create item", variant: "destructive" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMenuItem(itemToDelete.id!);
      setMenuItems(menuItems.filter((item) => item.id !== itemToDelete.id));
      toast({ title: "Menu item deleted!" });
    } catch (e) {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }

    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Menu Items</h2>
          <p className="text-muted-foreground">
            Add the items you want to offer on your menu.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {menuItems.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
          <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No menu items yet</h3>
          <p className="text-muted-foreground mb-4">
            Add at least one menu item to complete your setup
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="h-32 w-full bg-muted flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryName(item.categoryId)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${item.available
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong>Tip:</strong> You need at least one menu item to complete your restaurant setup.
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Image Upload Stub */}
            <div className="space-y-2">
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                placeholder="e.g., Caesar Salad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Describe the dish..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="item-price">Price *</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="item-category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between">
              <Label htmlFor="item-available">Available for ordering</Label>
              <Switch
                id="item-available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

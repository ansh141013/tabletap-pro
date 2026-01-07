import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Utensils, Upload, Loader2, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Category, MenuItem } from "@/pages/OwnerSetup";

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
    category_id: "",
    image_url: "",
    available: true,
  });
  
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id || "",
      image_url: "",
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
      category_id: item.category_id,
      image_url: item.image_url,
      available: item.available,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-items')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('menu-items')
      .getPublicUrl(filePath);

    setFormData({ ...formData, image_url: urlData.publicUrl });
    setIsUploading(false);
    toast({ title: "Image uploaded!" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: "Valid price is required", variant: "destructive" });
      return;
    }
    if (!formData.category_id) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const itemData = {
      restaurant_id: restaurantId,
      category_id: formData.category_id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.image_url,
      available: formData.available,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        toast({ title: "Failed to update item", variant: "destructive" });
      } else {
        setMenuItems(
          menuItems.map((item) =>
            item.id === editingItem.id
              ? { ...itemData, id: editingItem.id }
              : item
          )
        );
        toast({ title: "Menu item updated!" });
      }
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        toast({ title: "Failed to create item", variant: "destructive" });
      } else if (data) {
        setMenuItems([
          ...menuItems,
          {
            id: data.id,
            name: data.name,
            description: data.description || "",
            price: Number(data.price),
            category_id: data.category_id,
            image_url: data.image_url || "",
            available: data.available,
          },
        ]);
        toast({ title: "Menu item added!" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemToDelete.id);

    if (error) {
      toast({ title: "Failed to delete item", variant: "destructive" });
    } else {
      setMenuItems(menuItems.filter((item) => item.id !== itemToDelete.id));
      toast({ title: "Menu item deleted!" });
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
              {item.image_url ? (
                <img
                  src={item.image_url}
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
                      {getCategoryName(item.category_id)}
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
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.available
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
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="flex items-start gap-4">
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Menu item"
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="item-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('item-image-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                </div>
              </div>
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
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

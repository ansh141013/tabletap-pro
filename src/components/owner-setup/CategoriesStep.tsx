import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Category } from "@/pages/OwnerSetup";

interface CategoriesStepProps {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  restaurantId: string;
}

export const CategoriesStep = ({ categories, setCategories, restaurantId }: CategoriesStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const openAddDialog = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from('categories')
        .update({ name, description })
        .eq('id', editingCategory.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        });
      } else {
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? { ...c, name, description } : c
          )
        );
        toast({ title: "Category updated!" });
      }
    } else {
      // Create new category
      const { data, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurantId,
          name,
          description,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        });
      } else if (data) {
        setCategories([
          ...categories,
          { id: data.id, name: data.name, description: data.description || "" },
        ]);
        toast({ title: "Category added!" });
      }
    }

    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. Make sure it has no menu items.",
        variant: "destructive",
      });
    } else {
      setCategories(categories.filter((c) => c.id !== categoryToDelete.id));
      toast({ title: "Category deleted!" });
    }

    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Menu Categories</h2>
          <p className="text-muted-foreground">
            Organize your menu by creating categories like Appetizers, Main Courses, Desserts, etc.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">
            Add at least one category to organize your menu items
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong>Tip:</strong> You need at least one category before proceeding to add menu items.
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                placeholder="e.g., Appetizers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                placeholder="Optional description for this category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
              {editingCategory ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              Any menu items in this category will also be deleted.
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

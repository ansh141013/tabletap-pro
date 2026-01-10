import { Category } from "@/pages/GuestMenu";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MenuCategoriesProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const MenuCategories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuCategoriesProps) => {
  if (categories.length === 0) return null;

  return (
    <ScrollArea className="w-full whitespace-nowrap mb-6">
      <div className="flex gap-2 pb-2 px-1">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(null as any)} // Using null for "All"
          className="flex-shrink-0"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(category.id)}
            className="flex-shrink-0"
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

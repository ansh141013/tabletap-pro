import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MenuSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MenuSearch = ({ searchQuery, onSearchChange }: MenuSearchProps) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onSearchChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

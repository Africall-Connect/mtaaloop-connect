import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryTabsNavProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryTabsNav = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsNavProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide snap-x snap-mandatory">
      <Button
        variant={!selectedCategory ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "whitespace-nowrap flex-shrink-0 snap-start text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 touch-target",
          !selectedCategory && "bg-primary text-primary-foreground"
        )}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category)}
          className={cn(
            "whitespace-nowrap flex-shrink-0 snap-start text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 touch-target",
            selectedCategory === category && "bg-primary text-primary-foreground"
          )}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

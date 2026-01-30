import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryTabsNavProps {
  categories: string[];
  subcategories: string[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectSubcategory: (subcategory: string | null) => void;
}

export const CategoryTabsNav = ({
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryTabsNavProps) => {
  return (
    <div className="space-y-3 mb-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
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

      {/* Subcategory Tabs - Only show when a category is selected and has subcategories */}
      {selectedCategory && subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          <Button
            variant={!selectedSubcategory ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelectSubcategory(null)}
            className={cn(
              "whitespace-nowrap flex-shrink-0 snap-start text-xs h-7 px-3 touch-target",
              !selectedSubcategory && "bg-secondary text-secondary-foreground"
            )}
          >
            All {selectedCategory}
          </Button>
          {subcategories.map((subcategory) => (
            <Button
              key={subcategory}
              variant={selectedSubcategory === subcategory ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSelectSubcategory(subcategory)}
              className={cn(
                "whitespace-nowrap flex-shrink-0 snap-start text-xs h-7 px-3 touch-target",
                selectedSubcategory === subcategory && "bg-secondary text-secondary-foreground"
              )}
            >
              {subcategory}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

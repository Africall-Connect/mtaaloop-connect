import { Star, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem } from "@/data/vendors";

interface MenuItemCardProps {
  item: MenuItem;
  vendorId: string;
  vendorName: string;
  onCustomize: () => void;
}

export const MenuItemCard = ({ item, onCustomize }: MenuItemCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
          {item.image && (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          )}
          {item.isPopular && (
            <div className="absolute top-1 right-1 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded">
              <Flame className="w-3 h-3" />
            </div>
          )}
          {item.isNew && (
            <div className="absolute top-1 right-1 bg-success text-success-foreground text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {item.description}
          </p>

          <div className="flex items-center gap-2 mb-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-medium">{item.rating}</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{item.ordersThisWeek} orders this week</span>
          </div>

          {item.customizations && (
            <Badge variant="outline" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Customizable
            </Badge>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex flex-col justify-between items-end">
          <div className="text-xl font-bold text-primary">
            KSh {item.price}
          </div>
          <Button onClick={onCustomize} size="sm">
            + Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
};

import { Link } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export const FloatingCartButton = () => {
  const { vendorGroups, getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <Link to="/cart">
        <Button
          size="lg"
          className="shadow-glow px-8 py-6 text-lg gap-3 rounded-full relative"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{itemCount} items</span>
          <span>•</span>
          <span className="font-bold">KSh {total}</span>
          <span>→</span>

          {/* Multi-vendor indicator */}
          {vendorGroups.length > 1 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1"
            >
              <Store className="w-3 h-3 mr-1" />
              {vendorGroups.length}
            </Badge>
          )}
        </Button>
      </Link>
    </div>
  );
};

import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Sparkles, label: "Services", path: "/quick-services" },
  { icon: ShoppingCart, label: "Cart", path: "/cart", showBadge: true },
  { icon: User, label: "Account", path: "/account" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Hide on certain pages like checkout, order tracking, auth pages, and all portal pages
  const hiddenPrefixes = ["/vendor", "/admin", "/rider", "/estate"];
  const hiddenExactOrPrefix = ["/checkout", "/auth", "/orders/", "/trash-tracking/"];

  const shouldHide =
    location.pathname === "/" ||
    location.pathname === "/marketplace" ||
    hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix)) ||
    hiddenExactOrPrefix.some(
      (path) => location.pathname === path || location.pathname.startsWith(path)
    );

  // Special case: show on exact paths, hide on landing page
  if (location.pathname === "/" || shouldHide) {
    // But show on /home, /quick-services, /cart, /account
    const showPaths = ["/home", "/quick-services", "/cart", "/account", "/mtaaloop"];
    if (!showPaths.some((p) => location.pathname.startsWith(p))) {
      return null;
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/home" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.showBadge && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-4">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

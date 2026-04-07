import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Bell, ChevronRight } from "lucide-react";

const TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/vendor-approvals": "Vendor Approvals",
  "/admin/vendor-management": "Vendor Management",
  "/admin/rider-approvals": "Rider Approvals",
  "/admin/estate-approvals": "Estate Approvals",
  "/admin/estates": "Estate Management",
  "/admin/onboarding": "Onboard Users",
  "/admin/orders": "Orders",
  "/admin/deliveries": "Deliveries",
  "/admin/bookings": "Bookings",
  "/admin/service-requests": "Service Requests",
  "/admin/manage-mtaaloop-mart": "MtaaLoop Mart",
  "/admin/payouts": "Vendor Payouts",
  "/admin/wallets": "Wallets",
  "/admin/analytics": "Analytics",
  "/admin/reviews": "Reviews",
  "/admin/live-chat-assign": "Live Chat Assignment",
  "/admin/inbox": "Inbox",
  "/admin/compliance": "Compliance",
  "/admin/seed-ilora": "Seed Ilora Flowers",
  "/admin/seed-products": "Seed Vendor Products",
  "/admin/tickets": "Support Tickets",
};

interface AdminTopBarProps {
  onOpenSidebar: () => void;
}

export function AdminTopBar({ onOpenSidebar }: AdminTopBarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/admin/estates") ? "Estate Management" : "Admin");

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Hamburger (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb / title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-slate-500 hidden sm:inline">Admin</span>
          <ChevronRight className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <h1 className="font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/inbox")}
            title="Inbox"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs text-slate-500">Signed in as</span>
            <span className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

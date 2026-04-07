import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, ChevronRight } from "lucide-react";

const TITLES: Record<string, string> = {
  "/csr/dashboard": "Dashboard",
  "/csr/queue": "Chat Queue",
  "/csr/inbox": "Inbox",
  "/csr/tickets": "Support Tickets",
  "/csr/customers": "Customer Lookup",
  "/csr/canned-responses": "Canned Responses",
  "/csr/orders": "Order Management",
  "/csr/service-requests": "Service Requests",
  "/csr/vendor-campaigns": "Vendor Campaigns",
  "/csr/reviews": "Reviews & Feedback",
  "/csr/campaigns": "Reminders & Campaigns",
};

interface CSRTopBarProps {
  onOpenSidebar: () => void;
}

export function CSRTopBar({ onOpenSidebar }: CSRTopBarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/csr/customers/") ? "Customer Profile" : "Support");

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-slate-500 hidden sm:inline">Support</span>
          <ChevronRight className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <h1 className="font-semibold text-slate-900 dark:text-white truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
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

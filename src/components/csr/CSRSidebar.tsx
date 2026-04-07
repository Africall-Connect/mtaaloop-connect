import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Inbox as InboxIcon,
  Clock,
  Ticket,
  Users,
  BookOpen,
  Headphones,
  ShoppingCart,
  Megaphone,
  Star,
  Send,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/csr/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Live Support",
    items: [
      { to: "/csr/queue", label: "Chat Queue", icon: Clock },
      { to: "/csr/inbox", label: "Inbox", icon: InboxIcon },
    ],
  },
  {
    label: "Tickets",
    items: [
      { to: "/csr/tickets", label: "All Tickets", icon: Ticket },
    ],
  },
  {
    label: "Customers",
    items: [
      { to: "/csr/customers", label: "Customer Lookup", icon: Users },
    ],
  },
  {
    label: "Order & Delivery",
    items: [
      { to: "/csr/orders", label: "Orders", icon: ShoppingCart },
      { to: "/csr/service-requests", label: "Service Requests", icon: ClipboardList },
    ],
  },
  {
    label: "Vendor Support",
    items: [
      { to: "/csr/vendor-campaigns", label: "Vendor Campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Feedback",
    items: [
      { to: "/csr/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Outreach",
    items: [
      { to: "/csr/campaigns", label: "Reminders & Campaigns", icon: Send },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { to: "/csr/canned-responses", label: "Canned Responses", icon: BookOpen },
    ],
  },
];

interface CSRSidebarProps {
  onNavigate?: () => void;
}

export function CSRSidebar({ onNavigate }: CSRSidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm">MtaaLoop Support</div>
          <div className="text-xs text-slate-400">CSR Workspace</div>
        </div>
      </div>

      {/* Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-emerald-600/20 text-emerald-300 font-medium"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800 text-[11px] text-slate-500">
        v1.0 · Support Workspace
      </div>
    </aside>
  );
}

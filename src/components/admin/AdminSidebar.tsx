import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  Building2,
  UserCog,
  UserPlus,
  ShoppingCart,
  Truck,
  CalendarDays,
  ClipboardList,
  Package,
  Flower2,
  DollarSign,
  Wallet,
  BarChart3,
  Star,
  MessageSquare,
  ShieldCheck,
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
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
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/vendor-management", label: "Vendors", icon: Store },
      { to: "/admin/vendor-approvals", label: "Vendor Approvals", icon: CheckCircle },
      { to: "/admin/rider-approvals", label: "Rider Approvals", icon: Bike },
      { to: "/admin/estate-approvals", label: "Estate Approvals", icon: Building2 },
      { to: "/admin/estates", label: "Estates", icon: Building2 },
      { to: "/admin/onboarding", label: "Onboard Users", icon: UserPlus },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/deliveries", label: "Deliveries", icon: Truck },
      { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
      { to: "/admin/service-requests", label: "Service Requests", icon: ClipboardList },
      { to: "/admin/manage-mtaaloop-mart", label: "MtaaLoop Mart", icon: Package },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/tickets", label: "Support Tickets", icon: AlertTriangle },
    ],
  },
  {
    label: "Financial",
    items: [
      { to: "/admin/payouts", label: "Vendor Payouts", icon: DollarSign },
      { to: "/admin/wallets", label: "Wallets", icon: Wallet },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/live-chat-assign", label: "Live Chat", icon: MessageSquare },
      { to: "/admin/inbox", label: "Inbox", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
      { to: "/admin/seed-ilora", label: "Seed Ilora", icon: Flower2 },
      { to: "/admin/seed-products", label: "Seed Products", icon: Database },
    ],
  },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <UserCog className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm">MtaaLoop Admin</div>
          <div className="text-xs text-slate-400">Control Center</div>
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
                            ? "bg-blue-600/20 text-blue-300 font-medium"
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
        v1.0 · Admin Panel
      </div>
    </aside>
  );
}

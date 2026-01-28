import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  CreditCard,
  Wallet,
  Star,
  Gift,
  Settings,
  HelpCircle,
  LogOut,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserMetadata {
  full_name?: string;
  name?: string;
  phone?: string;
  phone_number?: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  avatarUrl?: string;
  memberSince?: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const handleLogout = async () => {
    await supabase.auth.signOut();

    toast({
      title: "Logged out successfully",
      description: "Come back soon!",
    });

    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  // fetch current logged in user
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) {
          navigate("/auth/login");
          return;
        }

        // Fetch from customer_profiles table
        const { data: customerProfile, error: profileError } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("customer_id", user.id)
          .eq("status", "delivered");
          
        const { data: premiumOrdersData, error: premiumOrdersError } = await supabase
          .from("premium_orders")
          .select("id", { count: "exact" })
          .eq("customer_id", user.id)
          .eq("status", "delivered");

        if (ordersError) {
          console.error("Error fetching delivered orders:", ordersError);
        }
        if (premiumOrdersError) {
          console.error("Error fetching delivered premium orders:", premiumOrdersError);
        }

        const totalDeliveredOrders = (ordersData?.length ?? 0) + (premiumOrdersData?.length ?? 0);
        const memberSinceDate = user?.created_at
          ? new Date(user.created_at).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "";

        if (customerProfile) {
          setProfile({
            name: customerProfile.full_name,
            email: user.email ?? "",
            phone: customerProfile.phone || undefined,
            loyaltyPoints: customerProfile.loyalty_points || 0,
            totalOrders: totalDeliveredOrders,
            totalSpent: customerProfile.total_spent || 0,
            avatarUrl: customerProfile.avatar_url || undefined,
            memberSince: memberSinceDate,
          });
        } else {
          // Fallback to user metadata if profile doesn't exist yet
          const metadata = user.user_metadata as UserMetadata;
          const fullName =
            metadata?.full_name ||
            metadata?.name ||
            user.email?.split("@")[0] ||
            "MtaaLoop User";

          const phone =
            metadata?.phone ||
            metadata?.phone_number ||
            "";

          setProfile({
            name: fullName,
            email: user.email ?? "",
            phone,
            loyaltyPoints: 0,
            totalOrders: totalDeliveredOrders,
            totalSpent: 0,
            memberSince: memberSinceDate,
          });
        }
      } catch (err) {
        console.error("Error loading user:", err);
        toast({
          title: "Could not load your account",
          description: "Please login again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, toast]);

  const stats = [
    { label: "Total Orders", value: profile?.totalOrders ?? 0 },
    { label: "Member Since", value: profile?.memberSince ?? "..." },
    // Removed Loyalty Points and Money Saved per customer-side requirements
  ];

  const links = [
  { icon: Package, label: "My Orders", href: "/account/orders" },
  // { icon: MapPin, label: "Saved Addresses", href: "/account/addresses" },
  { icon: CreditCard, label: "Payment Methods", href: "/account/payments" },
  { icon: Wallet, label: "Wallet & Points", href: "/account/wallet" },
  // { icon: Star, label: "My Reviews", href: "/account/reviews" },
  { icon: Gift, label: "Refer Friends", href: "/refer" },
  { icon: Settings, label: "Settings", href: "/account/settings" },
  { icon: HelpCircle, label: "Help & Support", href: "/help" },
  { icon: Send, label: "Inbox", href: "/inbox" },
  { icon: HelpCircle, label: "Live Support", href: "/support-live-chat" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">👤 Account</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl overflow-hidden">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.name?.charAt(0)?.toUpperCase() ?? "👤"
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {loading ? "Loading..." : profile?.name ?? "MtaaLoop User"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {loading ? "..." : profile?.email ?? ""}
              </p>
              {profile?.phone ? (
                <p className="text-sm text-muted-foreground">{profile.phone}</p>
              ) : null}
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate("/account/settings")}> 
            Edit Profile
          </Button>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📊 Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <h3 className="font-semibold mb-4">Quick Links</h3>
          {links.map((link) => (
            <Link key={link.label} to={link.href}>
              <Card
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  link.label === "Live Support"
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                  <span className="ml-auto">→</span>
                </div>
              </Card>
            </Link>
          ))}

          <Card
            className="p-4 hover:bg-destructive/10 transition-colors cursor-pointer border-destructive/20"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3 text-destructive">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;

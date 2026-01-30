import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  CreditCard,
  Wallet,
  Gift,
  Settings,
  HelpCircle,
  LogOut,
  ArrowLeft,
  Send,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [email, setEmail] = useState<string>("");

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

  // Fetch current logged in user
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

        // Set email immediately (available from auth)
        setEmail(user.email ?? "");

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

          const phone = metadata?.phone || metadata?.phone_number || "";

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
  ];

  const links = [
    { icon: Package, label: "My Orders", href: "/account/orders" },
    { icon: CreditCard, label: "Payment Methods", href: "/account/payments" },
    { icon: Wallet, label: "Wallet & Points", href: "/account/wallet" },
    { icon: Gift, label: "Refer Friends", href: "/refer" },
    { icon: Settings, label: "Settings", href: "/account/settings" },
    { icon: HelpCircle, label: "Help & Support", href: "/help" },
    { icon: Send, label: "Inbox", href: "/inbox" },
    { icon: HelpCircle, label: "Live Support", href: "/support-live-chat", highlight: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Account</h1>
        </div>

        {/* Hero Profile Card */}
        <Card className="relative overflow-hidden mb-6 border-primary/10">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-blue-500/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              {loading ? (
                <Skeleton className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-4xl overflow-hidden shadow-lg">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
              )}
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold truncate">
                      {profile?.name ?? "MtaaLoop User"}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {email || profile?.email}
                    </p>
                    {profile?.phone && (
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full bg-background/80 backdrop-blur hover:bg-primary/10 border-primary/20" 
              onClick={() => navigate("/account/settings")}
            >
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat) => (
            <Card 
              key={stat.label} 
              className="p-4 bg-card/80 backdrop-blur border-primary/10 hover:border-primary/30 transition-colors"
            >
              {loading ? (
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="space-y-2 mb-6">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
            Quick Links
          </h3>
          {links.map((link) => (
            <Link key={link.label} to={link.href}>
              <Card
                className={`p-4 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group ${
                  link.highlight
                    ? "bg-primary/10 border-primary/20"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    link.highlight 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  }`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium flex-1">{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <Card
          className="p-4 hover:bg-destructive/10 transition-colors cursor-pointer border-destructive/20 group"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-3 text-destructive">
            <div className="p-2 rounded-full bg-destructive/10 group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Logout</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Account;

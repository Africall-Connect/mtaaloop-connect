import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  // we add `staffMapping` here so we can route staff too
  const routeByRole = async (
    roles: string[] | null | undefined,
    userId: string,
    staffMapping?: { vendor_id: string } | null
  ) => {
    // 0. staff wins before customer flow
    if (staffMapping?.vendor_id) {
      // store which vendor they belong to
      localStorage.setItem("ml_vendor_profile_id", staffMapping.vendor_id);
      localStorage.setItem("ml_vendor_staff", "true");
      return navigate("/vendor/dashboard");
    }

    // 1. role-based routes
    if (roles?.includes("vendor")) return navigate("/vendor/dashboard");
    if (roles?.includes("rider")) return navigate("/rider/dashboard");
    if (roles?.includes("agent")) return navigate("/agent/dashboard");
    if (roles?.includes("estate") || roles?.includes("estate_manager"))
      return navigate("/estate/dashboard");

    // 2. no role -> check if user has already picked estate/apartment
    const { data: prefs, error: prefsErr } = await supabase
      .from("user_preferences")
      .select("estate_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!prefsErr && prefs?.estate_id) {
      return navigate("/home");
    }

    // 3. first time → force select
    return navigate("/apartment-selection");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // 1) fetch roles (your old code)
        const { data: rolesRows, error: rolesErr } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const roles = (rolesRows || []).map((r) => r.role);

        // 2) check if this user is STAFF of a vendor (new part)
        // this table is the one we created for accepted invites
        const { data: staffMap, error: staffErr } = await supabase
          .from("vendor_user_map")
          .select("vendor_id, role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // 3) if user is real vendor, keep your old vendor-profile fetch
        if (roles.includes("vendor")) {
          const { data: vp, error: vpErr } = await supabase
            .from("vendor_profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (vpErr) {
            console.error("Vendor profile fetch error:", vpErr.message);
            toast.error("Your vendor profile was not found. Contact admin.");
          } else {
            localStorage.setItem("ml_vendor_profile_id", vp.id);
            localStorage.removeItem("ml_vendor_staff");
          }
        }

        // 4) toast + route
        toast.success("Welcome back!");
        await routeByRole(roles, data.user.id, staffMap);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred during login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-start mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Login to your MtaaLoop account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email or Phone</Label>
            <Input
              id="email"
              type="text"
              placeholder="john@example.com or +254712345678"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/auth/signup" className="text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErrorResponse } from "@/types/common";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.agreeToTerms) {
    toast.error("Please agree to Terms & Conditions");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        },
      },
    });

    if (error) throw error;

    // Auto-fill user profile
    if (data.user?.id) {
      const nameParts = formData.fullName.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase.from('customer_profiles').upsert({
        user_id: data.user.id,
        full_name: formData.fullName,
        phone: formData.phone,
      });

      if (profileError) {
        console.error('Profile auto-fill error:', profileError);
        // Don't fail signup if profile fails, just log
      }
    }

    toast.success("Account created successfully!");

    // If you're using email confirmation, this message will be shown
    // even though they still need to verify their email.
    // Optionally redirect to a "check your email" page here.
    navigate("/apartment-selection");
  } catch (error) {
    const err = error as ErrorResponse;
    toast.error(err.message || "An error occurred during signup");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join MtaaLoop today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Kamau"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+254 712 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
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
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, agreeToTerms: checked as boolean })
              }
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Signup;

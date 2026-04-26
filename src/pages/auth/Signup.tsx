import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TermsAgreementCheckbox } from "@/components/TermsAgreementCheckbox";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErrorResponse } from "@/types/common";
import { checkClientRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { logSecurityEvent } from "@/lib/securityLogger";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formLoadTime = useRef(Date.now());
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
    if (!/\d/.test(pw)) return "Password must contain a number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ Honeypot: bots fill hidden fields
    if (honeypot) {
      console.warn("[signup] Honeypot triggered - likely bot");
      // Fake success to not alert the bot
      setEmailSent(true);
      return;
    }

    // 🛡️ Timing: humans take >2 seconds to fill a form
    if (Date.now() - formLoadTime.current < 2000) {
      console.warn("[signup] Form submitted too fast - likely bot");
      toast.error("Please slow down and try again.");
      return;
    }

    // 🛡️ Rate limit
    const rateCheck = checkClientRateLimit("signup", RATE_LIMITS.signup);
    if (!rateCheck.allowed) {
      toast.error(`Too many signup attempts. Try again in ${Math.ceil(rateCheck.lockoutRemainingMs / 1000)}s`);
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("Please agree to Terms & Conditions");
      return;
    }

    const pwError = validatePassword(formData.password);
    if (pwError) {
      toast.error(pwError);
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/apartment-selection`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      // Auto-fill customer profile
      if (data.user?.id) {
        const { error: profileError } = await supabase.from('customer_profiles').upsert({
          user_id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
        });

        if (profileError) {
          console.error('Profile auto-fill error:', profileError);
        }
      }

      setEmailSent(true);
      logSecurityEvent({
        event_type: "signup",
        user_id: data.user?.id,
      });
      toast.success("Account created! Please verify your email.");
    } catch (error) {
      const err = error as ErrorResponse;
      logSecurityEvent({
        event_type: "signup_failure",
        metadata: { reason: err.message },
        severity: "warn",
      });
      toast.error(err.message || "An error occurred during signup");
    } finally {
      setSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <div className="space-y-3">
            <Button variant="outline" asChild className="w-full">
              <Link to="/auth/login">Go to Login</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join MtaaLoop today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field - hidden from humans, bots fill it */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
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
                placeholder="Min 8 chars, mixed case + number"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Must include uppercase, lowercase, and a number
            </p>
          </div>

          <TermsAgreementCheckbox
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, agreeToTerms: checked })
            }
          >
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms & Conditions
            </Link>
          </TermsAgreementCheckbox>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
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

import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Refer = () => {
  const referralCode = "MTL-JK2025";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Code copied to clipboard!");
  };

  const referrals = [
    { name: "Sarah M.", status: "pending", earned: 0 },
    { name: "Peter K.", status: "completed", earned: 200 },
    { name: "Mary W.", status: "completed", earned: 200 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">🎁 Refer & Earn</h1>
        </div>

        <Card className="p-8 mb-6 text-center bg-gradient-to-br from-gold/20 to-warning/20">
          <h2 className="text-3xl font-bold mb-4">Give KSh 200, Get KSh 200</h2>
          <div className="space-y-2 text-left max-w-md mx-auto mb-6">
            <div className="flex gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <div className="font-semibold">Share your code with friends</div>
                <div className="text-sm text-muted-foreground">Send them your unique code</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <div className="font-semibold">They get KSh 200 on first order</div>
                <div className="text-sm text-muted-foreground">Instant discount for new users</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <div className="font-semibold">You get KSh 200 when they order</div>
                <div className="text-sm text-muted-foreground">Added to your wallet automatically</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Your Referral Code</h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-muted rounded-lg p-4 text-center">
              <div className="text-3xl font-bold font-mono">{referralCode}</div>
            </div>
            <Button onClick={handleCopy} size="lg">
              <Copy className="w-5 h-5 mr-2" />
              Copy
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              SMS
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Email
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              More
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Your Referrals</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">5</div>
              <div className="text-sm text-muted-foreground">Friends Joined</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">KSh 1,000</div>
              <div className="text-sm text-muted-foreground">Earned Total</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Recent Referrals</h4>
            {referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <div className="font-medium">{ref.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {ref.status === "pending" ? "Pending first order" : "Completed"}
                  </div>
                </div>
                <div className="text-right">
                  {ref.status === "completed" ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">+KSh {ref.earned}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Refer;

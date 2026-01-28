import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Store, Building2, Bike } from "lucide-react";

const RoleSelection = () => {
  const roles = [
    {
      icon: ShoppingBag,
      title: "Shop as Customer",
      description: "Browse and order from local vendors in your estate",
      benefits: ["Easy ordering", "Fast delivery", "Track orders", "Exclusive deals"],
      link: "/auth/signup",
      color: "text-primary"
    },
    {
      icon: Store,
      title: "Sell as Vendor",
      description: "Grow your business by reaching customers in estates",
      benefits: ["Own storefront", "Manage products", "Track sales", "Build your brand"],
      link: "/auth/vendor-signup",
      color: "text-green-600"
    },
    {
      icon: Building2,
      title: "Register Your Estate",
      description: "Bring MtaaLoop services to your residential community",
      benefits: ["Vendor marketplace", "Resident convenience", "Community growth", "Management tools"],
      link: "/auth/estate-signup",
      color: "text-blue-600"
    },
    {
      icon: Bike,
      title: "Deliver as Rider",
      description: "Earn money by delivering orders in your area",
      benefits: ["Flexible hours", "Earn income", "Simple process", "Weekly payouts"],
      link: "/auth/rider-signup",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join MtaaLoop</h1>
          <p className="text-muted-foreground">Choose how you'd like to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <Link key={index} to={role.link}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <role.icon className={`h-8 w-8 ${role.color}`} />
                    <CardTitle>{role.title}</CardTitle>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

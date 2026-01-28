import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const PaymentMethods = () => {
  const [mpesaNumber, setMpesaNumber] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMpesaNumber = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("user_preferences")
            .select("mpesa_number")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          if (data) {
            setMpesaNumber(data.mpesa_number);
          }
        }
      } catch (error) {
        console.error("Error fetching M-Pesa number:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMpesaNumber();
  }, []);

  const handleSave = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("user_preferences")
          .update({ mpesa_number: mpesaNumber })
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "M-Pesa number saved successfully.",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving M-Pesa number:", error);
      toast({
        title: "Error",
        description: "Failed to save M-Pesa number.",
        variant: "destructive",
      });
    }
  };

  const paymentMethods = [
    {
      id: 2,
      type: "Credit Card",
      icon: CreditCard,
      number: "**** **** **** 1234",
      expiry: "12/25",
      isDefault: false,
    },
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
          <h1 className="text-3xl font-bold">💳 Payment Methods</h1>
        </div>

        <Button className="w-full mb-6">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">M-Pesa</h3>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={mpesaNumber || ""}
                      onChange={(e) => setMpesaNumber(Number(e.target.value))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isLoading
                        ? "Loading..."
                        : mpesaNumber || "Not set"}
                    </p>
                  )}
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-1 inline-block">
                    Default
                  </span>
                </div>
              </div>
              {isEditing ? (
                <Button onClick={handleSave} size="sm">
                  Save
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </Card>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card key={method.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{method.type}</h3>
                      <p className="text-sm text-muted-foreground">
                        {method.number}
                      </p>
                      {method.expiry && (
                        <p className="text-xs text-muted-foreground">
                          Expires {method.expiry}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;

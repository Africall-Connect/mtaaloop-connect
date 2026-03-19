import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, MapPin, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TrashCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // User details
  const [fullName, setFullName] = useState<string>("");
  const [estateName, setEstateName] = useState<string>("");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [houseNumber, setHouseNumber] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [includeTrashBag, setIncludeTrashBag] = useState(false);
  
  const trashCollectionFee = 30; // 30 shillings
  const trashBagFee = 5; // 5 shillings
  const totalAmount = trashCollectionFee + (includeTrashBag ? trashBagFee : 0);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          const metadata = user.user_metadata;
          const fetchedFullName =
            metadata?.full_name ||
            metadata?.name ||
            user.email?.split("@")[0] ||
            "MtaaLoop User";
          setFullName(fetchedFullName);

          // Fetch user preferences
          const { data: preferences, error: preferencesError } = await supabase
            .from("user_preferences")
            .select("estate_id, apartment_name")
            .eq("user_id", user.id)
            .single();

          if (preferencesError && preferencesError.code !== "PGRST116") {
            throw preferencesError;
          }

          if (preferences) {
            if (preferences.estate_id) {
              setEstateId(preferences.estate_id);
            }
            if (preferences.apartment_name) {
              setEstateName(preferences.apartment_name);
            }
          }

          // Fetch user address
          const { data: address, error: addressError } = await supabase
            .from("delivery_addresses")
            .select("unit_number")
            .eq("user_id", user.id)
            .eq("is_default", true)
            .maybeSingle();

          if (addressError) {
            console.error("Error fetching address:", addressError);
          }

          if (address) {
            setHouseNumber(address.unit_number || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserDetails();
  }, []);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("You must be logged in to request trash collection.");
      navigate("/auth/login");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to Terms & Conditions");
      return;
    }

    if (!houseNumber.trim()) {
      toast.error("Please enter your house/apartment number");
      return;
    }

    if (!estateId) {
      toast.error("Please select your estate/apartment from your profile");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare customer notes with trash bag info
      const notesWithBagInfo = includeTrashBag 
        ? (customerNotes ? `${customerNotes}\n\n[TRASH BAG INCLUDED - KSh ${trashBagFee}]` : `[TRASH BAG INCLUDED - KSh ${trashBagFee}]`)
        : customerNotes || null;

      // Create trash collection order
      const { data: newOrder, error: orderError } = await supabase
        .from('trash_collection')
        .insert([
          {
            customer_id: user.id,
            estate_id: estateId,
            amount: totalAmount,
            house: houseNumber,
            full_name: fullName,
            customer_notes: notesWithBagInfo,
            status: 'pending',
            payment_status: 'pending',
          },
        ])
        .select('*')
        .single();

      if (orderError) throw orderError;

      // Create trash delivery record for rider assignment
      const { error: deliveryError } = await supabase
        .from('trash_deliveries')
        .insert({
          trash_collection_id: newOrder.id,
          estate_id: estateId,
          status: 'pending',
        });

      if (deliveryError) throw deliveryError;

      toast.success("Trash collection request placed successfully! Agent will arrive in less than 10 minutes.");
      
      // Navigate directly to tracking page
      navigate(`/trash-tracking/${newOrder.id}`);

    } catch (error: unknown) {
      console.error("Error placing trash collection order:", error);
      toast.error(`Failed to place order: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 to-background">
      <div className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trash Collection</h1>
              <p className="text-sm text-muted-foreground">Quick & convenient doorstep pickup</p>
            </div>
          </div>
        </div>

        {/* Service Info Card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Service Promise</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">⚡</span>
                <span>Agent arrives in <strong>less than 10 minutes</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">🚪</span>
                <span>Pick up from your <strong>doorstep/gate</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">🚛</span>
                <span>Transport & dispose at garbage base</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">💚</span>
                <span>You do nothing - just place order & put trash outside</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Order Form */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">📍 Pickup Details</h2>
            
            {/* Estate Name */}
            <div className="space-y-3 mb-4">
              <Label htmlFor="estate_name" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Estate/Apartment
              </Label>
              <Input
                id="estate_name"
                placeholder="e.g. Greenpark Estate"
                value={estateName}
                readOnly
                className="bg-muted"
              />
              {!estateId && (
                <p className="text-xs text-destructive">
                  Please set your estate in your profile settings
                </p>
              )}
            </div>

            {/* House Number */}
            <div className="space-y-3 mb-4">
              <Label htmlFor="house_number" className="flex items-center gap-2">
                <HomeIcon className="w-4 h-4" />
                House/Apartment Number
              </Label>
              <Input
                id="house_number"
                placeholder="e.g. House 123A"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>

            {/* Customer Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes">📝 Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder='Example: "Trash bags are at the gate" or "Ring doorbell when you arrive"'
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Trash Bag Option */}
          <div className="border-t pt-4">
            <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <Checkbox
                id="trashBag"
                checked={includeTrashBag}
                onCheckedChange={(checked) => setIncludeTrashBag(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="trashBag" className="cursor-pointer font-semibold flex items-center gap-2">
                  🛍️ Include a Trash Bag
                  <span className="text-emerald-600 font-bold">+ KSh {trashBagFee}</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get a quality trash bag delivered with the agent for convenient disposal
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-semibold">KSh {trashCollectionFee}</span>
            </div>
            {includeTrashBag && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Trash Bag</span>
                <span className="font-semibold">KSh {trashBagFee}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
              <span>TOTAL</span>
              <span className="text-emerald-600">KSh {totalAmount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              One-time payment • Agent arrives in less than 10 minutes
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
              I agree to Terms & Conditions. I understand that the agent will pick up trash from my doorstep/gate.
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePlaceOrder}
            className="w-full"
            size="lg"
            disabled={isProcessing || !agreedToTerms || !estateId}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing Request...
              </span>
            ) : (
              `Request Trash Collection - KSh ${totalAmount}`
            )}
          </Button>

          {isProcessing && (
            <Card className="p-6 bg-emerald-50 border-emerald-200">
              <div className="text-center space-y-3">
                <div className="text-4xl animate-bounce">🚛</div>
                <h3 className="font-bold text-lg">Finding Nearest Agent</h3>
                <p className="text-sm text-muted-foreground">
                  We're notifying available agents in your area...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Please wait...
                </div>
              </div>
            </Card>
          )}

          <p className="text-center text-sm text-muted-foreground">
            🔒 Secure payment • 💚 Eco-friendly service
          </p>
        </Card>

        {/* How It Works - Mobile optimized with horizontal scroll option */}
        <Card className="p-4 sm:p-6 mt-6 bg-muted/30">
          <h3 className="font-bold mb-4">How It Works</h3>
          <div className="flex overflow-x-auto pb-2 gap-4 sm:grid sm:grid-cols-1 sm:overflow-visible sm:pb-0 sm:gap-3 scrollbar-hide">
            {[
              { step: 1, title: "Place Your Order", desc: "Confirm your pickup location" },
              { step: 2, title: "Agent Notified", desc: "Nearest available agent accepts your request" },
              { step: 3, title: "Agent On The Way", desc: "You'll get a notification when agent is coming" },
              { step: 4, title: "Pickup Complete", desc: "Agent picks up trash and disposes it properly" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 min-w-[200px] sm:min-w-0">
                <div className="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 touch-target">
                  {item.step}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrashCollection;

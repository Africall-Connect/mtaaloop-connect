import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, MapPin, CreditCard, ClipboardCheck, Clock, Wallet, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import PromoCodeInput from "@/components/PromoCodeInput";
import { toast } from "sonner";
import OrderAnimation from "@/components/order/OrderAnimation";
import {
  validateDeliveryStep,
  validatePaymentStep,
  sanitizeCheckoutData,
} from "@/lib/schemas/checkoutSchema";

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

interface PromoCode {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, removeItem, setItems } = useCart();
  const { user } = useAuth();
  const [deliveryAddress, setDeliveryAddress] = useState({
    estate_name: "",
    house_number: "",
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryType, setDeliveryType] = useState("asap");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [instructions, setInstructions] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastOrderDetails, setLastOrderDetails] = useState<unknown>(null);
  const [fullName, setFullName] = useState<string>("");

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPreferencesAndAddress = async () => {
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
              setDeliveryAddress((prev) => ({
                ...prev,
                estate_name: preferences.apartment_name,
              }));
            }
          }

          // Pre-fill house number from user_preferences
          const { data: prefWithHouse } = await supabase
            .from("user_preferences")
            .select("house_name")
            .eq("user_id", user.id)
            .single();

          if (prefWithHouse?.house_name) {
            setDeliveryAddress((prev) => ({
              ...prev,
              house_number: prefWithHouse.house_name,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchPreferencesAndAddress();
  }, []);

  const deliveryFee = 1;
  const subtotal = getTotal();
  const discount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? Math.round((subtotal * appliedPromo.discount) / 100)
      : Math.min(appliedPromo.discount, subtotal)
    : 0;
  const discountedSubtotal = subtotal - discount;
  const total = discountedSubtotal + deliveryFee;

  const clearFieldError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePlaceOrder = async () => {
    const deliveryValidation = validateDeliveryStep({
      estate_name: deliveryAddress.estate_name,
      house_number: deliveryAddress.house_number,
      instructions,
      deliveryType,
    });

    if (!deliveryValidation.success) {
      setFormErrors(deliveryValidation.errors);
      toast.error("Please fix the delivery details errors");
      setStep(1);
      return;
    }

    const paymentValidation = validatePaymentStep(paymentMethod);

    if (!paymentValidation.success) {
      setFormErrors(paymentValidation.errors);
      toast.error("Please fix the payment details errors");
      setStep(2);
      return;
    }

    if (!agreedToTerms) {
      setFormErrors((prev) => ({ ...prev, agreedToTerms: "You must agree to Terms & Conditions" }));
      toast.error("Please agree to Terms & Conditions");
      return;
    }

    const sanitized = sanitizeCheckoutData({
      instructions,
      houseNumber: deliveryAddress.house_number,
    });

    setFormErrors({});

    const mtaaLoopMartItems = items.filter((item) => item.vendorId === "MtaaLoopMart");
    const minimartItems = items.filter((item) => item.category === "Minimart");
    const mtaaLoopManagedItems = items.filter((item) => item.isMtaaLoopManaged && item.vendorId !== "MtaaLoopMart");
    const otherItems = items.filter(
      (item) => item.vendorId !== "MtaaLoopMart" && item.category !== "Minimart" && !item.isMtaaLoopManaged
    );

    if (mtaaLoopMartItems.length > 0) {
      await handlePremiumOrder(mtaaLoopMartItems);
    }

    if (minimartItems.length > 0) {
      await handleMinimartOrder(minimartItems);
    }

    if (mtaaLoopManagedItems.length > 0) {
      await handleMtaaLoopOrder(mtaaLoopManagedItems);
    }

    if (otherItems.length > 0) {
      await handleRegularOrder(otherItems);
    }
  };

  const handlePremiumOrder = async (premiumItems: CartItem[]) => {
    if (!user) {
      toast.error("You must be logged in to place a premium order.");
      return;
    }

    const totalAmount = premiumItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const baseAmount = premiumItems.reduce(
      (sum, item) => sum + (item.base_price || item.price) * item.quantity,
      0
    );

    try {
      const { data: newOrder, error: orderError } = await supabase
        .from("premium_orders")
        .insert([
          {
            customer_id: user.id,
            estate_id: estateId,
            total_amount: totalAmount,
            base_amount: baseAmount,
            delivery_address: `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`,
            customer_notes: instructions,
            house: deliveryAddress.house_number,
            full_name: fullName,
          },
        ])
        .select("*")
        .single();

      if (orderError) throw orderError;

      const orderItems = premiumItems.map((item) => ({
        premium_order_id: newOrder.id,
        product_id: item.id,
        product_name: item.name,
        clean_name: item.name,
        base_price: item.base_price || item.price,
        markup_price: item.price,
        quantity: item.quantity,
        image_url: item.image,
      }));

      const { error: itemError } = await supabase.from("premium_order_items").insert(orderItems);
      if (itemError) throw itemError;

      const { error: deliveryError } = await supabase.from("premium_deliveries").insert({
        premium_order_id: newOrder.id,
        estate_id: estateId,
        status: "pending",
        rider_reimbursement: baseAmount,
      });

      if (deliveryError) throw deliveryError;

      toast.success("Premium order placed successfully!");
      premiumItems.forEach((item) => removeItem(item.id));
      setLastOrderId(newOrder.id);
      setShowAnimation(true);
    } catch (error: unknown) {
      toast.error(`Failed to place premium order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleMinimartOrder = async (minimartItems: CartItem[]) => {
    if (!user) {
      toast.error("You must be logged in to place a minimart order.");
      return;
    }

    const totalAmount = minimartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const baseAmount = totalAmount;
    const vendorId = minimartItems[0]?.vendorId;

    try {
      const { data: newOrder, error: orderError } = await supabase
        .from("premium_orders")
        .insert([
          {
            customer_id: user.id,
            estate_id: estateId,
            total_amount: totalAmount,
            base_amount: baseAmount,
            delivery_address: `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`,
            customer_notes: instructions,
            vendor_id: vendorId,
            house: deliveryAddress.house_number,
            full_name: fullName,
          },
        ])
        .select("*")
        .single();

      if (orderError) throw orderError;

      const orderItems = minimartItems.map((item) => ({
        premium_order_id: newOrder.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        base_price: item.price,
        markup_price: item.price,
        image_url: item.image,
      }));

      const { error: itemError } = await supabase.from("premium_order_items").insert(orderItems);
      if (itemError) throw itemError;

      const { error: deliveryError } = await supabase.from("premium_deliveries").insert({
        premium_order_id: newOrder.id,
        estate_id: estateId,
        status: "pending",
        rider_reimbursement: baseAmount,
      });

      if (deliveryError) throw deliveryError;

      toast.success("Minimart order placed successfully!");
      minimartItems.forEach((item) => removeItem(item.id));
      setLastOrderId(newOrder.id);
      setShowAnimation(true);
    } catch (error: unknown) {
      toast.error(`Failed to place minimart order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleMtaaLoopOrder = async (mtaaLoopItems: CartItem[]) => {
    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    const orderId = crypto.randomUUID();
    const totalAmount = mtaaLoopItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const businessTypeId = mtaaLoopItems[0]?.businessTypeId;

    try {
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            id: orderId,
            customer_id: user.id,
            business_type_id: businessTypeId,
            is_mtaaloop_managed: true,
            estate_id: estateId,
            total_amount: totalAmount + deliveryFee,
            delivery_address: `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`,
            customer_notes: instructions,
            house: deliveryAddress.house_number,
            full_name: fullName,
            status: "pending",
            user_email: user?.email,
          },
        ])
        .select("*")
        .single();

      if (orderError) throw orderError;

      const orderItems = mtaaLoopItems.map((item) => ({
        order_id: orderId,
        product_service_id: item.productServiceId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemError } = await supabase.from("order_items").insert(orderItems);
      if (itemError) throw itemError;

      const { error: deliveryError } = await supabase.from("mtaaloop_deliveries").insert({
        order_id: orderId,
        business_type_id: businessTypeId,
        estate_id: estateId,
        status: "pending",
        delivery_address: `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`,
        delivery_instructions: instructions,
        delivery_fee: deliveryFee,
      });

      if (deliveryError) throw deliveryError;

      toast.success("Order placed successfully!");
      mtaaLoopItems.forEach((item) => removeItem(item.id));
      setLastOrderId(orderId);
      setShowAnimation(true);
    } catch (error: unknown) {
      toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("MtaaLoop order error:", error);
    }
  };

  const handleRegularOrder = async (regularItems: CartItem[]) => {
    const orderId = crypto.randomUUID();

    let category: string | null = null;
    if (regularItems.length > 0) {
      const firstItemId = regularItems[0].id;
      try {
        const { data: product, error } = await supabase
          .from("products")
          .select("category")
          .eq("id", firstItemId)
          .single();

        if (error) {
          console.error("Error fetching product category:", error);
        } else if (product) {
          category = product.category;
        }
      } catch (error) {
        console.error("Error in fetching product category:", error);
      }
    }

    const orderDetails = {
      vendorId: regularItems[0]?.vendorId,
      vendorName: regularItems[0]?.vendorName,
      estateId: estateId,
      totalAmount: total,
      deliveryAddress: `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`,
      customerNotes: instructions || null,
      deliveryFee: deliveryFee,
      category: category,
      items: regularItems.map((item) => ({
        productId: null,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const { error: orderError } = await supabase.from("orders").insert([
        {
          id: orderId,
          customer_id: user?.id,
          vendor_id: orderDetails.vendorId,
          estate_id: orderDetails.estateId,
          total_amount: orderDetails.totalAmount,
          delivery_address: orderDetails.deliveryAddress,
          customer_notes: orderDetails.customerNotes,
          category: orderDetails.category,
          house: deliveryAddress.house_number,
          full_name: fullName,
          user_email: user?.email,
        },
      ]);

      if (orderError) throw orderError;

      const orderItems = regularItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemError } = await supabase.from("order_items").insert(orderItems);
      if (itemError) throw itemError;
    } catch (error: unknown) {
      toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    clearCart();
    toast.success("Order placed successfully!");
    setLastOrderId(orderId);
    setLastOrderDetails(orderDetails);
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    if (lastOrderId) {
      navigate(`/orders/${lastOrderId}`, { state: { orderDetails: lastOrderDetails } });
    }
  };

  if (showAnimation) {
    return <OrderAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-24 sm:pb-0">
      <div className="container px-4 py-4 sm:py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="touch-target shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold">Checkout</h1>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 px-2 sm:px-0">
          {[
            { num: 1, label: "Delivery", icon: MapPin },
            { num: 2, label: "Payment", icon: CreditCard },
            { num: 3, label: "Review", icon: ClipboardCheck },
          ].map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      s.num === step
                        ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                        : s.num < step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium ${s.num <= step ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-colors ${s.num < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1: Delivery */}
        {step === 1 && (
          <Card className="p-6 space-y-6 border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Delivery Details</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estate_name">Estate Name</Label>
              <Input
                id="estate_name"
                placeholder="e.g. Greenpark Estate"
                value={deliveryAddress.estate_name}
                readOnly
                className="bg-muted"
              />
              {formErrors["deliveryAddress.estate_name"] && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors["deliveryAddress.estate_name"]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="house_number">House/Apartment Number</Label>
              <Input
                id="house_number"
                placeholder="e.g. House 123A"
                value={deliveryAddress.house_number}
                onChange={(e) => {
                  clearFieldError("deliveryAddress.house_number");
                  setDeliveryAddress({
                    ...deliveryAddress,
                    house_number: e.target.value,
                  });
                }}
                className={formErrors["deliveryAddress.house_number"] ? "border-destructive" : ""}
                maxLength={50}
              />
              {formErrors["deliveryAddress.house_number"] && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors["deliveryAddress.house_number"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Label>Delivery Instructions</Label>
              </div>
              <Textarea
                placeholder='Example: "Ring doorbell twice" or "Leave at door if no answer"'
                value={instructions}
                onChange={(e) => {
                  clearFieldError("instructions");
                  setInstructions(e.target.value);
                }}
                className={formErrors.instructions ? "border-destructive" : ""}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formErrors.instructions && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.instructions}
                  </span>
                )}</span>
                <span>{instructions.length}/500</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label className="font-medium">Delivery Time</Label>
              </div>
              <RadioGroup
                value={deliveryType}
                onValueChange={(value) => {
                  setDeliveryType(value);
                  if (value === "schedule") {
                    setShowTimeSlotPicker(true);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="asap" id="asap" />
                  <Label htmlFor="asap" className="cursor-pointer">
                    ASAP (5-7 minutes)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
              </RadioGroup>

              {selectedTimeSlot && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    📅 Scheduled for: {new Date(selectedTimeSlot.date).toLocaleDateString()} at{" "}
                    {new Date(`2000-01-01T${selectedTimeSlot.time}`).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              )}
            </div>

            {showTimeSlotPicker && (
              <TimeSlotPicker
                onSelect={(slot) => {
                  setSelectedTimeSlot(slot);
                  setShowTimeSlotPicker(false);
                }}
              />
            )}

            <Button
              className="w-full"
              onClick={() => {
                const validation = validateDeliveryStep({
                  estate_name: deliveryAddress.estate_name,
                  house_number: deliveryAddress.house_number,
                  instructions,
                  deliveryType,
                });

                if (!validation.success) {
                  setFormErrors(validation.errors);
                  const firstError = Object.values(validation.errors)[0];
                  toast.error(firstError || "Please fix the form errors");
                  return;
                }

                setFormErrors({});
                setStep(2);
              }}
            >
              Continue to Payment →
            </Button>
          </Card>
        )}

        {/* STEP 2: Payment */}
        {step === 2 && (
          <Card className="p-6 space-y-6 border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Payment Method</h2>
            </div>

            <PromoCodeInput
              subtotal={subtotal}
              onApply={(promo) => setAppliedPromo(promo)}
              onRemove={() => setAppliedPromo(null)}
            />

            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "wallet"
                      ? "border-primary bg-primary/5 border-l-4"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => setPaymentMethod("wallet")}
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <Label htmlFor="wallet" className="font-semibold cursor-pointer text-base">
                          MtaaLoop Wallet
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Pay using your MtaaLoop Wallet balance</p>
                      <p className="text-sm text-primary mt-2">✅ Fast & Secure</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "pay_on_delivery"
                      ? "border-primary bg-primary/5 border-l-4"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => setPaymentMethod("pay_on_delivery")}
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <Label htmlFor="pay_on_delivery" className="font-semibold cursor-pointer text-base">
                          Pay on Delivery
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Pay when your order arrives</p>
                      <p className="text-sm text-primary mt-2">🚚 Cash or M-PESA on delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue to Review →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">✅ Review Your Order</h2>

            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-semibold mb-1">FROM: {items[0]?.vendorName}</div>
                <div className="text-sm text-muted-foreground">
                  📍 200m away • 🕐 5-7 min delivery
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">YOUR ORDER:</div>
                <ul className="space-y-1 text-sm">
                  {items.map((item) => (
                    <li key={item.id}>
                      • {item.quantity}x {item.name}
                      {item.customizations && " (customized)"}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold mb-2">DELIVERING TO:</div>
                <div className="text-sm">
                  {deliveryAddress.estate_name}, {deliveryAddress.house_number}
                  {instructions && (
                    <div className="text-muted-foreground mt-1">"{instructions}"</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">PAYMENT:</div>
                <div className="text-sm">
                  {paymentMethod === "wallet" && "MtaaLoop Wallet"}
                  {paymentMethod === "pay_on_delivery" && "Pay on Delivery"}
                </div>
                {appliedPromo && (
                  <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                    🎟️ {appliedPromo.code} applied: Save KSh {discount}
                  </div>
                )}
              </div>

              <div>
                <div className="font-semibold mb-2">ESTIMATED ARRIVAL:</div>
                <div className="text-sm">
                  {selectedTimeSlot
                    ? `📅 ${new Date(selectedTimeSlot.date).toLocaleDateString()} at ${new Date(
                        `2000-01-01T${selectedTimeSlot.time}`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}`
                    : "🕐 5-7 minutes after order confirmed"}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KSh {subtotal}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-KSh {discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>KSh {deliveryFee}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>TOTAL</span>
                <span className="text-primary">KSh {total}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => {
                    setAgreedToTerms(checked as boolean);
                    if (checked) {
                      clearFieldError("agreedToTerms");
                    }
                  }}
                  className={formErrors.agreedToTerms ? "border-destructive" : ""}
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to Terms & Conditions
                </Label>
              </div>
              {formErrors.agreedToTerms && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.agreedToTerms}
                </p>
              )}
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={isProcessingPayment}
              >
                ← Back
              </Button>
              <Button
                onClick={handlePlaceOrder}
                className="flex-1"
                size="lg"
                disabled={isProcessingPayment || !agreedToTerms}
              >
                {isProcessingPayment ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  `Place Order - KSh ${total}`
                )}
              </Button>
            </div>

            {/* Mobile sticky footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border sm:hidden safe-area-bottom z-50">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="touch-target"
                  disabled={isProcessingPayment}
                  size="sm"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  className="flex-1 touch-target"
                  size="lg"
                  disabled={isProcessingPayment || !agreedToTerms}
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </span>
                  ) : (
                    `Pay KSh ${total}`
                  )}
                </Button>
              </div>
            </div>

          </Card>
        )}

        {/* Order summary footer */}
        {step < 3 && (
          <Card className="mt-4 p-4 border-primary/10">
            <div className="space-y-2 text-sm">
              <div className="font-semibold mb-2">Order Summary</div>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>KSh {item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">KSh {total}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;

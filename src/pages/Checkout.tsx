import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MTAALOOP_MART_VENDOR_ID } from "@/constants/mtaaloopMart";
import {
  ArrowLeft, ArrowRight, MapPin, CreditCard, ClipboardCheck,
  Clock, Wallet, Truck, Smartphone, ShoppingBag, CheckCircle2,
  AlertCircle, Package, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { getWalletBalance, debitWallet } from "@/lib/customerWallet";

interface TimeSlot { date: string; time: string; available: boolean; }
interface PromoCode { code: string; discount: number; type: "percentage" | "fixed"; description: string; }

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1 as Step, label: "Delivery", icon: MapPin },
  { num: 2 as Step, label: "Payment", icon: CreditCard },
  { num: 3 as Step, label: "Review", icon: ClipboardCheck },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, removeItem, calculateDeliveryFee } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [deliveryAddress, setDeliveryAddress] = useState({ estate_name: "", house_number: "" });
  const [deliveryType, setDeliveryType] = useState("asap");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [instructions, setInstructions] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastOrderDetails, setLastOrderDetails] = useState<unknown>(null);
  const [fullName, setFullName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // ── Fetch user preferences & wallet ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const meta = authUser.user_metadata;
        setFullName(meta?.full_name || meta?.name || authUser.email?.split("@")[0] || "MtaaLoop User");

        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("estate_id, apartment_name, house_name")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (prefs) {
          if (prefs.estate_id) setEstateId(prefs.estate_id);
          if (prefs.apartment_name) setDeliveryAddress(p => ({ ...p, estate_name: prefs.apartment_name }));
          if (prefs.house_name) setDeliveryAddress(p => ({ ...p, house_number: prefs.house_name }));
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
      }
    })();
  }, []);

  // ── Fetch wallet balance ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const balance = await getWalletBalance();
        setWalletBalance(balance);
      } catch (e) {
        console.error("Error fetching wallet:", e);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, []);

  // ── Pricing ──────────────────────────────────────────────────────
  const subtotal = getTotal();
  const deliveryFee = calculateDeliveryFee(true);
  const discount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? Math.round((subtotal * appliedPromo.discount) / 100)
      : Math.min(appliedPromo.discount, subtotal)
    : 0;
  const total = subtotal - discount + deliveryFee;

  // ── Helpers ──────────────────────────────────────────────────────
  const clearFieldError = (f: string) => setFormErrors(p => { const n = { ...p }; delete n[f]; return n; });

  const goToStep = (target: Step) => {
    if (target === 2) {
      const v = validateDeliveryStep({
        estate_name: deliveryAddress.estate_name,
        house_number: deliveryAddress.house_number,
        instructions,
        deliveryType,
      });
      if (!v.success) { setFormErrors(v.errors); toast.error(Object.values(v.errors)[0]); return; }
      setFormErrors({});
    }
    setStep(target);
  };

  // ── Order handlers ───────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to Terms & Conditions");
      return;
    }

    // Wallet balance check
    if (paymentMethod === "wallet") {
      if (walletBalance === null || walletBalance < total) {
        toast.error(`Insufficient wallet balance. You have KSh ${walletBalance ?? 0} but need KSh ${total}`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const mtaaLoopMartItems = items.filter(i => i.vendorId === MTAALOOP_MART_VENDOR_ID);
      const minimartItems = items.filter(i => i.category === "Minimart");
      const mtaaLoopManagedItems = items.filter(i => i.isMtaaLoopManaged && i.vendorId !== MTAALOOP_MART_VENDOR_ID);
      const otherItems = items.filter(i => i.vendorId !== MTAALOOP_MART_VENDOR_ID && i.category !== "Minimart" && !i.isMtaaLoopManaged);

      const allOrderIds: string[] = [];

      if (mtaaLoopMartItems.length > 0) { const id = await placeOrder("premium", mtaaLoopMartItems); if (id) allOrderIds.push(id); }
      if (minimartItems.length > 0) { const id = await placeOrder("minimart", minimartItems); if (id) allOrderIds.push(id); }
      if (mtaaLoopManagedItems.length > 0) { const id = await placeOrder("mtaaloop", mtaaLoopManagedItems); if (id) allOrderIds.push(id); }
      if (otherItems.length > 0) { const id = await placeOrder("regular", otherItems); if (id) allOrderIds.push(id); }

      // Debit wallet after all orders placed
      if (paymentMethod === "wallet" && allOrderIds.length > 0) {
        try {
          await debitWallet(total, allOrderIds[0], `Payment for order${allOrderIds.length > 1 ? 's' : ''}`);
          // Update all orders to paid
          for (const oid of allOrderIds) {
            await supabase.from("orders").update({ payment_status: "paid", payment_channel: "wallet", paid_at: new Date().toISOString() }).eq("id", oid);
          }
          setWalletBalance(prev => (prev ?? 0) - total);
          toast.success("Wallet payment successful!");
        } catch (walletErr: unknown) {
          toast.error(`Wallet payment failed: ${walletErr instanceof Error ? walletErr.message : "Unknown error"}`);
          return;
        }
      }
    } catch (e) {
      console.error("Order error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const placeOrder = async (type: string, orderItems: CartItem[]): Promise<string | null> => {
    if (!user) { toast.error("Please log in first."); return null; }
    const addr = `${deliveryAddress.estate_name}, ${deliveryAddress.house_number}`;
    const totalAmount = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const baseAmount = orderItems.reduce((s, i) => s + (i.base_price || i.price) * i.quantity, 0);

    try {
      if (type === "premium" || type === "minimart") {
        const { data: newOrder, error: orderError } = await supabase
          .from("premium_orders")
          .insert([{
            customer_id: user.id, estate_id: estateId,
            total_amount: totalAmount, base_amount: baseAmount,
            delivery_address: addr, customer_notes: instructions,
            house: deliveryAddress.house_number, full_name: fullName,
            ...(type === "minimart" ? { vendor_id: orderItems[0]?.vendorId } : {}),
          }])
          .select("*").single();
        if (orderError) throw orderError;

        await supabase.from("premium_order_items").insert(
          orderItems.map(i => ({
            premium_order_id: newOrder.id, product_id: i.id,
            product_name: i.name, clean_name: i.name,
            base_price: i.base_price || i.price, markup_price: i.price,
            quantity: i.quantity, image_url: i.image,
          }))
        );
        await supabase.from("premium_deliveries").insert({
          premium_order_id: newOrder.id, estate_id: estateId,
          status: "pending", rider_reimbursement: baseAmount,
        });
        orderItems.forEach(i => removeItem(i.id));
        setLastOrderId(newOrder.id);
        setShowAnimation(true);
        toast.success(`${type === "premium" ? "Premium" : "Minimart"} order placed!`);
        return newOrder.id;

      } else if (type === "mtaaloop") {
        const orderId = crypto.randomUUID();
        const bTypeId = orderItems[0]?.businessTypeId;
        await supabase.from("orders").insert([{
          id: orderId, customer_id: user.id, business_type_id: bTypeId,
          is_mtaaloop_managed: true, estate_id: estateId,
          total_amount: totalAmount + deliveryFee, delivery_address: addr,
          customer_notes: instructions, house: deliveryAddress.house_number,
          full_name: fullName, status: "pending", user_email: user.email,
        }]).select("*").single();

        await supabase.from("order_items").insert(
          orderItems.map(i => ({
            order_id: orderId, product_service_id: i.productServiceId,
            product_name: i.name, quantity: i.quantity, price: i.price,
          }))
        );
        await (supabase.from("deliveries") as any).insert({
          order_id: orderId, estate_id: estateId,
          status: "pending", delivery_fee: deliveryFee,
        });
        orderItems.forEach(i => removeItem(i.id));
        setLastOrderId(orderId);
        setShowAnimation(true);
        toast.success("Order placed successfully!");
        return orderId;

      } else {
        const orderId = crypto.randomUUID();
        let category: string | null = null;
        try {
          const { data: prod } = await supabase.from("products").select("category").eq("id", orderItems[0].id).single();
          if (prod) category = prod.category;
        } catch {}

        await supabase.from("orders").insert([{
          id: orderId, customer_id: user.id, vendor_id: orderItems[0]?.vendorId,
          estate_id: estateId, total_amount: total, delivery_address: addr,
          customer_notes: instructions || null, category,
          house: deliveryAddress.house_number, full_name: fullName, user_email: user.email,
        }]);
        await supabase.from("order_items").insert(
          orderItems.map(i => ({ order_id: orderId, product_id: i.id, product_name: i.name, quantity: i.quantity, price: i.price }))
        );
        clearCart();
        setLastOrderId(orderId);
        setLastOrderDetails({ vendorId: orderItems[0]?.vendorId, vendorName: orderItems[0]?.vendorName });
        setShowAnimation(true);
        toast.success("Order placed successfully!");
      }
    } catch (error: unknown) {
      toast.error(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (showAnimation) {
    return <OrderAnimation onAnimationComplete={() => lastOrderId && navigate(`/orders/${lastOrderId}`, { state: { orderDetails: lastOrderDetails } })} />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground text-center">Add some items before checking out.</p>
        <Button onClick={() => navigate("/home")}>Browse Products</Button>
      </div>
    );
  }

  // ── Group items by vendor for display ────────────────────────────
  const vendorMap = items.reduce((map, item) => {
    if (!map[item.vendorId]) map[item.vendorId] = { name: item.vendorName, items: [] };
    map[item.vendorId].items.push(item);
    return map;
  }, {} as Record<string, { name: string; items: CartItem[] }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="max-w-2xl mx-auto px-4 py-4 pb-40">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep((step - 1) as Step) : navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* ── Step Indicator ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const active = s.num === step;
            const done = s.num < step;
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    active ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20" :
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium ${active || done ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
                {idx < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        {/* ═══════════════ STEP 1: DELIVERY ═══════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Delivery Address</h2>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estate">Estate Name</Label>
                <Input id="estate" value={deliveryAddress.estate_name} readOnly className="bg-muted" />
                {formErrors["deliveryAddress.estate_name"] && (
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors["deliveryAddress.estate_name"]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="house">House / Apartment Number</Label>
                <Input
                  id="house"
                  placeholder="e.g. B204"
                  value={deliveryAddress.house_number}
                  onChange={e => { clearFieldError("deliveryAddress.house_number"); setDeliveryAddress(p => ({ ...p, house_number: e.target.value })); }}
                  className={formErrors["deliveryAddress.house_number"] ? "border-destructive" : ""}
                  maxLength={50}
                />
                {formErrors["deliveryAddress.house_number"] && (
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors["deliveryAddress.house_number"]}</p>
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Delivery Time</h2>
              </div>
              <RadioGroup value={deliveryType} onValueChange={v => { setDeliveryType(v); if (v === "schedule") setShowTimeSlotPicker(true); }}>
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${deliveryType === "asap" ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => setDeliveryType("asap")}>
                  <RadioGroupItem value="asap" id="asap" />
                  <Label htmlFor="asap" className="cursor-pointer flex-1">
                    <div className="font-medium">ASAP (5-7 minutes)</div>
                    <div className="text-xs text-muted-foreground">Fastest delivery</div>
                  </Label>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${deliveryType === "schedule" ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => { setDeliveryType("schedule"); setShowTimeSlotPicker(true); }}>
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="cursor-pointer flex-1">
                    <div className="font-medium">Schedule for later</div>
                    <div className="text-xs text-muted-foreground">Pick a time slot</div>
                  </Label>
                </div>
              </RadioGroup>

              {selectedTimeSlot && (
                <div className="p-3 bg-primary/10 rounded-lg text-sm font-medium">
                  📅 {new Date(selectedTimeSlot.date).toLocaleDateString()} at {new Date(`2000-01-01T${selectedTimeSlot.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              )}
              {showTimeSlotPicker && <TimeSlotPicker onSelect={slot => { setSelectedTimeSlot(slot); setShowTimeSlotPicker(false); }} />}
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Delivery Instructions</h2>
              </div>
              <Textarea
                placeholder='e.g. "Ring doorbell twice" or "Leave at door"'
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{instructions.length}/500</p>
            </Card>
          </div>
        )}

        {/* ═══════════════ STEP 2: PAYMENT ════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Payment Method</h2>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                {[
                  { value: "wallet", icon: Wallet, title: "MtaaLoop Wallet", desc: "Pay from your wallet balance", badge: "Instant" },
                  { value: "mpesa", icon: Smartphone, title: "M-Pesa", desc: "Pay via M-Pesa STK push", badge: "Popular" },
                  { value: "pay_on_delivery", icon: Truck, title: "Pay on Delivery", desc: "Cash or M-Pesa when delivered", badge: null },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === opt.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                    }`}
                    onClick={() => setPaymentMethod(opt.value)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <opt.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{opt.title}</span>
                          {opt.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{opt.badge}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            <Card className="p-5">
              <PromoCodeInput subtotal={subtotal} onApply={p => setAppliedPromo(p)} onRemove={() => setAppliedPromo(null)} />
            </Card>
          </div>
        )}

        {/* ═══════════════ STEP 3: REVIEW ═════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Items grouped by vendor */}
            {Object.entries(vendorMap).map(([vendorId, group]) => (
              <Card key={vendorId} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{group.name}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                      <span className="font-medium">KSh {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Delivery summary */}
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Delivering To</h3>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{deliveryAddress.estate_name}, {deliveryAddress.house_number}</p>
                {instructions && <p className="mt-1 italic">"{instructions}"</p>}
                <p className="mt-1">
                  {selectedTimeSlot ? `📅 ${new Date(selectedTimeSlot.date).toLocaleDateString()}` : "🕐 ASAP (5-7 min)"}
                </p>
              </div>
            </Card>

            {/* Payment summary */}
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment</h3>
              <p className="text-sm">
                {paymentMethod === "wallet" && "💳 MtaaLoop Wallet"}
                {paymentMethod === "mpesa" && "📱 M-Pesa"}
                {paymentMethod === "pay_on_delivery" && "🚚 Pay on Delivery"}
              </p>
            </Card>

            {/* Price breakdown */}
            <Card className="p-5 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>KSh {subtotal}</span></div>
              {appliedPromo && <div className="flex justify-between text-sm text-primary"><span>Discount ({appliedPromo.code})</span><span>−KSh {discount}</span></div>}
              <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>KSh {deliveryFee}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">KSh {total}</span></div>
            </Card>

            {/* Terms */}
            <div className="flex items-start gap-2 px-1">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={c => setAgreedToTerms(c as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                I agree to the <span className="text-primary underline">Terms & Conditions</span>
              </Label>
            </div>
          </div>
        )}

        {/* ── Order Summary (Steps 1 & 2) ────────────────────────── */}
        {step < 3 && (
          <Card className="mt-4 p-4">
            <p className="text-sm font-semibold mb-2">Order Summary</p>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                <span>{item.quantity}× {item.name}</span>
                <span>KSh {item.price * item.quantity}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm"><span>Delivery</span><span>KSh {deliveryFee}</span></div>
            <div className="flex justify-between font-bold mt-1"><span>Total</span><span className="text-primary">KSh {total}</span></div>
          </Card>
        )}
      </div>

      {/* ── Sticky Bottom Bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary/20 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((step - 1) as Step)} className="px-6 h-12 text-base border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate(-1)} className="px-6 h-12 text-base border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold">
              <ArrowLeft className="h-5 w-5 mr-2" /> Cart
            </Button>
          )}

          {step < 3 ? (
            <Button className="flex-1 h-12 text-base font-bold shadow-lg" size="lg" onClick={() => goToStep((step + 1) as Step)}>
              Continue <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 h-12 text-base font-bold shadow-lg"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isProcessing || !agreedToTerms}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Processing...</span>
              ) : (
                `Place Order — KSh ${total}`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

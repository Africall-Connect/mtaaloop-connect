import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, MessageCircle, CheckCircle, Clock, 
  Edit, Plus, Share2, Star, AlertCircle, RefreshCw,
  Bell, BellOff, Pen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getServiceImage } from "@/lib/serviceImages";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Order } from "@/types/database";

interface OrderData {
  id: string;
  vendor_id: string;
  customer_id: string;
  estate_id: string | null;
  total_amount: number;
  status: string;
  payment_status?: string;
  delivery_address: string;
  customer_notes: string | null;
  created_at: string;
  category: string | null;
  rated?: boolean;
  vendor_name?: string;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  isPremium?: boolean;
}

interface DeliveryData {
  id: string;
  order_id: string;
  rider_id: string | null;
  status: string;
  delivery_fee: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  name?: string;
  quantity: number;
  price: number;
}

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;

// ============= Category-Specific Messaging Configuration =============
interface CategoryMessaging {
  icon: string;
  preparingTitle: string;
  preparingDescription: string;
  notificationTitle: string;
  timelineLabel: string;
  deliveredMessage: string;
  waitingHeadline: string;
  waitingSubtext: string;
  waitingTip: string;
  imageSlug: string;
}

const CATEGORY_MESSAGING: Record<string, CategoryMessaging> = {
  "Food & Drinks": {
    icon: "👨‍🍳",
    preparingTitle: "Preparing your order",
    preparingDescription: "Your delicious order is being prepared with care",
    notificationTitle: "Cooking Started! 👨‍🍳",
    timelineLabel: "Preparing Your Order",
    deliveredMessage: "Enjoy your meal!",
    waitingHeadline: "Your chef is crafting something delicious...",
    waitingSubtext: "Sit back and let the aroma come to you 🍽️",
    waitingTip: "💡 While you wait, why not set the table?",
    imageSlug: "food-drinks",
  },
  "Restaurant": {
    icon: "👨‍🍳",
    preparingTitle: "Preparing your meal",
    preparingDescription: "Your meal is being freshly prepared",
    notificationTitle: "Cooking Started! 👨‍🍳",
    timelineLabel: "Preparing Your Meal",
    deliveredMessage: "Enjoy your meal!",
    waitingHeadline: "A culinary masterpiece is underway...",
    waitingSubtext: "Your personal chef is putting the finishing touches 🧑‍🍳",
    waitingTip: "💡 Pro tip: Great meals taste better with good company!",
    imageSlug: "restaurant",
  },
  "Living Essentials": {
    icon: "🧴",
    preparingTitle: "Packing your items",
    preparingDescription: "Your items are being carefully packed",
    notificationTitle: "Packing Started! 📦",
    timelineLabel: "Packing Your Items",
    deliveredMessage: "Enjoy your items!",
    waitingHeadline: "Your essentials are being rounded up...",
    waitingSubtext: "We're making sure nothing is missing from your list ✅",
    waitingTip: "💡 Stock up smart — add essentials to your favourites for quick re-orders!",
    imageSlug: "living-essentials",
  },
  "Groceries & Food": {
    icon: "🛒",
    preparingTitle: "Packing your groceries",
    preparingDescription: "Your groceries are being carefully packed",
    notificationTitle: "Packing Started! 🛒",
    timelineLabel: "Packing Your Groceries",
    deliveredMessage: "Enjoy your groceries!",
    waitingHeadline: "Fresh picks coming your way...",
    waitingSubtext: "We're selecting the best items for you 🥬🍎",
    waitingTip: "💡 Did you know? Our vendors hand-pick the freshest produce just for you!",
    imageSlug: "fresh-produce",
  },
  "Utilities & Services": {
    icon: "🔧",
    preparingTitle: "Preparing your service",
    preparingDescription: "Your service request is being prepared",
    notificationTitle: "Service Preparing! 🔧",
    timelineLabel: "Preparing Your Service",
    deliveredMessage: "Service complete!",
    waitingHeadline: "Your service is being arranged...",
    waitingSubtext: "A specialist is being assigned to handle your request 🛠️",
    waitingTip: "💡 Make sure your space is accessible for the service provider.",
    imageSlug: "utilities-services",
  },
  "Home Services": {
    icon: "🏠",
    preparingTitle: "Preparing your service",
    preparingDescription: "Your home service is being arranged",
    notificationTitle: "Service Preparing! 🏠",
    timelineLabel: "Arranging Your Service",
    deliveredMessage: "Service complete!",
    waitingHeadline: "Your space is about to sparkle...",
    waitingSubtext: "Our cleaning pro is gearing up and heading your way ✨",
    waitingTip: "💡 Clear any fragile items from surfaces for the best clean possible!",
    imageSlug: "house-cleaning",
  },
  "Beauty & Spa": {
    icon: "💅",
    preparingTitle: "Preparing your appointment",
    preparingDescription: "Your appointment is being prepared",
    notificationTitle: "Appointment Ready! 💅",
    timelineLabel: "Preparing Your Appointment",
    deliveredMessage: "Thank you for your visit!",
    waitingHeadline: "Glamour is on its way...",
    waitingSubtext: "Your beauty specialist is preparing your session 💄",
    waitingTip: "💡 Arrive relaxed — your pampering session is almost ready!",
    imageSlug: "beauty-spa",
  },
  "Accommodation": {
    icon: "🏨",
    preparingTitle: "Preparing your stay",
    preparingDescription: "Your accommodation is being prepared",
    notificationTitle: "Booking Confirmed! 🏨",
    timelineLabel: "Preparing Your Stay",
    deliveredMessage: "Enjoy your stay!",
    waitingHeadline: "Your cozy stay is being prepared...",
    waitingSubtext: "Fresh linens, clean towels, and a warm welcome await 🛏️",
    waitingTip: "💡 Pack light — most essentials are provided at your accommodation!",
    imageSlug: "accommodation",
  },
  "Pharmacy": {
    icon: "💊",
    preparingTitle: "Preparing your medication",
    preparingDescription: "Your medication is being carefully prepared",
    notificationTitle: "Medication Ready! 💊",
    timelineLabel: "Preparing Your Medication",
    deliveredMessage: "Take care of yourself!",
    waitingHeadline: "Your health matters...",
    waitingSubtext: "Our pharmacist is carefully preparing your medication 🏥",
    waitingTip: "💡 Remember to follow the dosage instructions on your prescription.",
    imageSlug: "pharmacy",
  },
  "Liquor Store": {
    icon: "🍷",
    preparingTitle: "Preparing your drinks",
    preparingDescription: "Your drinks are being prepared",
    notificationTitle: "Drinks Preparing! 🍷",
    timelineLabel: "Preparing Your Drinks",
    deliveredMessage: "Enjoy responsibly!",
    waitingHeadline: "Fine selection incoming...",
    waitingSubtext: "Your drinks are being carefully packaged 🥂",
    waitingTip: "💡 Chill your glasses for the perfect pour!",
    imageSlug: "liquor-store",
  },
};

const DEFAULT_MESSAGING: CategoryMessaging = {
  icon: "📦",
  preparingTitle: "Preparing your order",
  preparingDescription: "Your order is being prepared",
  notificationTitle: "Order Preparing! 📦",
  timelineLabel: "Preparing Your Order",
  deliveredMessage: "Enjoy!",
  waitingHeadline: "Your order is on its way...",
  waitingSubtext: "We're preparing everything with care 🎁",
  waitingTip: "💡 You'll get notified the moment your order is ready!",
  imageSlug: "package-collection",
};

// Helper function to get category messaging
const getCategoryMessaging = (category: string | null | undefined): CategoryMessaging => {
  if (!category) return DEFAULT_MESSAGING;
  return CATEGORY_MESSAGING[category] || DEFAULT_MESSAGING;
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [progress, setProgress] = useState(0);
  const [isDelivered, setIsDelivered] = useState(false);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  
  // Rating and review state
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewData, setReviewData] = useState<Record<string, unknown> | null>(null);
  
  // E-signature state
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  // Cancel order state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Modify order state
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyNote, setModifyNote] = useState("");
  const [modifying, setModifying] = useState(false);

  // initial load
  useEffect(() => {
    if (orderId && user) {
      initializeOrder();
      requestNotificationPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user]);

  // Request notification permission on mount
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success("Notifications enabled! We'll keep you updated.", {
          duration: 3000,
        });
      }
    }
  };

  // realtime subscriptions with enhanced notifications
  useEffect(() => {
    if (!orderId) return;

    console.log("[OrderTracking] subscribing to realtime for order", orderId);

    const orderChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[Realtime] order update payload:", payload);
          const newStatus = payload.new.status as string;
          const oldStatus = orderStatus;
          
          setOrderStatus(newStatus);
          setLastUpdateTime(new Date().toLocaleTimeString());
          updateProgressFromStatus(newStatus);

          // Enhanced notification with status-specific messages
          if (notificationsEnabled && newStatus !== oldStatus) {
            // Get category-specific messaging for notifications
            const categoryMsg = getCategoryMessaging(orderData?.category);
            
            const statusMessages: Record<string, { title: string; description: string; emoji: string }> = {
              accepted: {
                title: "Order Confirmed! 🎉",
                description: "The vendor has accepted your order and will start soon.",
                emoji: "✅"
              },
              preparing: {
                title: categoryMsg.notificationTitle,
                description: categoryMsg.preparingDescription,
                emoji: categoryMsg.icon
              },
              ready: {
                title: "Order Ready! 📦",
                description: "Your order is ready and waiting for pickup by the rider.",
                emoji: "✨"
              },
              out_for_delivery: {
                title: "Rider Accepted! 🏍️",
                description: "A rider has accepted your delivery and is heading to the vendor.",
                emoji: "🚴"
              },
              in_transit: {
                title: "Out for Delivery! 🏍️",
                description: "Your order is on the way. Get ready to enjoy!",
                emoji: "🚀"
              },
              delivered: {
                title: "Delivered! 🎊",
                description: `Your order has arrived. ${categoryMsg.deliveredMessage}`,
                emoji: "🎉"
              },
              cancelled: {
                title: "Order Cancelled",
                description: "Your order has been cancelled.",
                emoji: "❌"
              }
            };

            const message = statusMessages[newStatus];
            if (message) {
              toast.success(message.title, {
                description: message.description,
                duration: 5000,
              });

              // Browser notification if permitted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(message.emoji + ' ' + message.title, {
                  body: message.description,
                  icon: '/icon-192x192.png',
                  badge: '/badge-72x72.png',
                  tag: `order-${orderId}`
                });
              }

              // Play sound effect (optional)
              try {
                const audio = new Audio('/sounds/notification.wav');
                audio.volume = 0.5;
                audio.play().catch(() => {/* ignore if audio fails */});
              } catch (e) {
                // Ignore audio errors
              }
            }
          }

          if (newStatus === "delivered") {
            setIsDelivered(true);
          }
        }
      )
      .subscribe();

    const deliveryChannel = supabase
      .channel(`delivery-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[Realtime] delivery update payload:", payload);
          const newStatus = payload.new.status as string;
          setDeliveryStatus(newStatus);
          setLastUpdateTime(new Date().toLocaleTimeString());
          
          if (newStatus === "delivered") {
            setIsDelivered(true);
            setProgress(100);
            
            if (notificationsEnabled) {
              toast.success("🎉 Delivery Complete!", {
                description: "Your order has been delivered. Enjoy!",
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[OrderTracking] unsubscribing realtime");
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [orderId, orderStatus, notificationsEnabled]);

  const initializeOrder = async () => {
    try {
      const { data: premiumOrder, error: premiumError } = await supabase
        .from('premium_orders')
        .select('*, premium_order_items(*)')
        .eq('id', orderId)
        .single();

      if (premiumOrder) {
        await loadPremiumOrder(premiumOrder);
      } else if (premiumError.code === 'PGRST116') {
        const { data: regularOrder, error: regularError } = await supabase
          .from('orders')
          .select('*, category, order_items(*)')
          .eq('id', orderId)
          .single();

        if (regularOrder) {
          await loadExistingOrder(regularOrder);
        } else if (location.state?.orderDetails) {
          await createOrder(location.state.orderDetails);
        } else {
          setError("No order details found");
        }
      } else {
        throw premiumError;
      }
    } catch (err) {
      setError(`Failed to load order: ${err.message}`);
    }
  };

  const loadExistingOrder = async (order: OrderData) => {
    console.log("[loadExistingOrder] order =", order);
    setOrderData({
      ...order,
      items: order.order_items ?? [],
    });
    setOrderStatus(order.status);
    updateProgressFromStatus(order.status);

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select("*")
      .eq("order_id", order.id)
      .single();

    console.log("[loadExistingOrder] delivery =", delivery, "error =", error);

    if (delivery) {
      setDeliveryData(delivery);
      setDeliveryStatus(delivery.status);
    }

    if (order.rated) {
      const { data: review, error: reviewError } = await supabase
        .from("order_reviews")
        .select("*")
        .eq("order_id", order.id)
        .single();
      
      if (reviewError) {
        console.error("Error fetching review:", reviewError);
      } else {
        setReviewData(review);
      }
    }
  };

  const loadPremiumOrder = async (order) => {
    setOrderData({
      ...order,
      isPremium: true,
      vendor_name: 'MtaaLoop Mart',
      items: order.premium_order_items.map(item => ({
        ...item,
        name: item.product_name,
        price: item.markup_price,
      })),
    });
    setOrderStatus(order.status);
    updateProgressFromStatus(order.status, true);
  };

  const createOrder = async (orderDetails: Record<string, unknown>) => {
  setIsCreatingOrder(true);
  console.log("[createOrder] incoming orderDetails =", orderDetails);
  try {
    const { data: newOrder, error: orderError } = await (supabase as any)
      .from("orders")
      .insert([{
        customer_id: user!.id,
        vendor_id: orderDetails.vendorId,
        estate_id: orderDetails.estateId || null,
        total_amount: orderDetails.totalAmount,
        status: "pending",
        delivery_address: orderDetails.deliveryAddress,
        customer_notes: orderDetails.customerNotes || null,
      }])
      .select()
      .single();

    // 👇 if we get duplicate key, it means the order already exists — just load it instead of failing
    if (orderError && orderError.code === "23505") {
      console.warn("[createOrder] order already exists, fetching instead");
      const { data: existingOrder, error: existingErr } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (existingErr) {
        throw existingErr;
      }

      setOrderData({
        ...existingOrder,
        items: existingOrder.order_items ?? [],
      });
      setOrderStatus(existingOrder.status);
      updateProgressFromStatus(existingOrder.status);

      // and we’re done
      toast.success("Order loaded.");
      return;
    }

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = (orderDetails.items as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
      order_id: newOrder.id,
      product_id: item.product_id as string,
      product_name: item.name as string,
      quantity: item.quantity as number,
      price: item.price as number,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      // If items fail, it's best to log it but not block the user,
      // as the main order is already created. This could be improved
      // with a transaction later.
      console.error("Failed to insert order items:", itemsError);
      toast.error("Could not save order items, but your order was placed.");
    }

    // Refetch the full order data to update the UI
    await loadExistingOrder(newOrder);
    toast.success("Order created successfully!");
  } catch (err) {
    console.error("[createOrder] Error creating order:", err);
    setError("Failed to create order");
    toast.error("Failed to create order");
  } finally {
    setIsCreatingOrder(false);
  }
};


  const updateProgressFromStatus = (status: string, isPremium = false) => {
    if (isPremium) {
      switch (status) {
        case "pending": setProgress(10); break;
        case "assigned": setProgress(25); break;
        case "rider_shopping": setProgress(50); break;
        case "purchased_at_carrefour": setProgress(75); break;
        case "in_transit": setProgress(90); break;
        case "delivered": setProgress(100); setIsDelivered(true); break;
        default: setProgress(0);
      }
    } else {
      switch (status) {
        case "pending": setProgress(10); break;
        case "accepted": setProgress(25); break;
        case "preparing": setProgress(45); break;
        case "ready": setProgress(60); break;
        case "out_for_delivery": setProgress(75); break;
        case "in_transit": setProgress(85); break;
        case "delivered": setProgress(100); setIsDelivered(true); break;
        default: setProgress(0);
      }
    }
  };

  const getStatusLabel = (status: string, isPremium = false) => {
    if (isPremium) {
      switch (status) {
        case "pending": return "Order Placed";
        case "assigned": return "Rider Found";
        case "rider_shopping": return "Rider is Shopping";
        case "purchased_at_carrefour": return "Shopping Complete";
        case "in_transit": return "Out for Delivery";
        case "delivered": return "Delivered";
        case "cancelled": return "Order Cancelled";
        default: return "Processing";
      }
    }
    // Use category-specific messaging for preparing status
    const messaging = getCategoryMessaging(orderData?.category);
    
    switch (status) {
      case "pending": return "Waiting for vendor to accept";
      case "accepted": return "Vendor accepted your order";
      case "preparing": return messaging.preparingTitle;
      case "ready": return "Ready for pickup";
      case "out_for_delivery": return "Rider accepted — on the way to vendor";
      case "in_transit": return "Out for delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Order cancelled";
      default: return "Processing order";
    }
  };

  // Get context-aware action buttons based on order status
  const getActionButtons = (status: string) => {
    const actions: { 
      label: string; 
      icon: React.ComponentType<{ className?: string }>; 
      variant?: ButtonVariant; 
      action: () => void 
    }[] = [];

    switch (status) {
      case "pending":
        actions.push(
          { 
            label: "Cancel Order", 
            icon: AlertCircle, 
            variant: "destructive", 
            action: () => setCancelDialogOpen(true) 
          },
          { 
            label: "Modify Order", 
            icon: Edit, 
            variant: "outline", 
            action: () => setModifyDialogOpen(true) 
          }
        );
        break;
      case "accepted":
      case "preparing":
        actions.push(
          { 
            label: "Call Vendor", 
            icon: Phone, 
            variant: "outline", 
            action: () => toast.info("Calling vendor...") 
          },
          { 
            label: "Add Items", 
            icon: Plus, 
            variant: "outline", 
            action: () => toast.info("Add items functionality coming soon") 
          }
        );
        break;
      case "out_for_delivery":
      case "in_transit":
        actions.push(
          { 
            label: "Call Rider", 
            icon: Phone, 
            variant: "outline", 
            action: () => toast.info("Calling rider...") 
          },
          { 
            label: "Share ETA", 
            icon: Share2, 
            variant: "outline", 
            action: () => {
              if (navigator.share) {
                navigator.share({
                  title: 'Order ETA',
                  text: `My order is arriving soon! Track it here:`,
                  url: window.location.href
                });
              } else {
                toast.success("Link copied to clipboard!");
              }
            } 
          }
        );
        break;
      case "delivered":
        actions.push(
          { 
            label: "Rate Order", 
            icon: Star, 
            variant: "default", 
            action: () => toast.info("Rating functionality coming soon") 
          },
          { 
            label: "Re-order", 
            icon: RefreshCw, 
            variant: "outline", 
            action: () => toast.info("Re-order functionality coming soon") 
          },
          { 
            label: "Report Issue", 
            icon: AlertCircle, 
            variant: "outline", 
            action: () => toast.info("Report issue functionality coming soon") 
          }
        );
        break;
    }

    return actions;
  };

  const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium ${className}`}>{children}</label>
  );

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!orderId || !user) return;
    
    if (foodRating === 0 || deliveryRating === 0) {
      toast.error("Please rate both food and delivery");
      return;
    }

    try {
      setSubmittingReview(true);

      const sanitizedComment = (reviewComment || "").replace(/<[^>]*>/g, "").trim().slice(0, 1000);

      const { error } = await supabase.from("order_reviews").insert({
        order_id: orderId,
        customer_id: user.id,
        food_rating: Math.max(1, Math.min(5, Math.floor(foodRating))),
        delivery_rating: Math.max(1, Math.min(5, Math.floor(deliveryRating))),
        comment: sanitizedComment || null,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // also update the order to mark it as rated
      await supabase
        .from("orders")
        .update({ rated: true })
        .eq("id", orderId);

      toast.success("Thank you for your review! 🎉");
      
      // Award loyalty points for review (optional)
      if (orderData?.customer_id) {
        supabase.rpc('award_points', {
          user_uuid: orderData.customer_id,
          points_to_add: 5,
          activity_type: 'review_submitted',
        }).then(() => {
          toast.success("You earned 5 bonus points! 💚");
        });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle e-signature confirmation
  const handleConfirmDelivery = async () => {
    if (!signature.trim()) {
      toast.error("Please provide your signature");
      return;
    }

    try {
      setConfirmingDelivery(true);

      // Update order status to delivered with signature
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          customer_signature: signature,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Update delivery status
      if (deliveryData?.id) {
        const { error: deliveryError } = await supabase
          .from("deliveries")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", deliveryData.id);

        if (deliveryError) throw deliveryError;
      }

      toast.success("Delivery confirmed! Thank you! 🎉");
      setSignatureDialogOpen(false);
      setIsDelivered(true);
      setProgress(100);
    } catch (err) {
      console.error("Error confirming delivery:", err);
      toast.error("Failed to confirm delivery. Please try again.");
    } finally {
      setConfirmingDelivery(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setCancelling(true);

      // Update order status to cancelled
      // Keep payment_status valid: if paid set to refunded, otherwise keep as-is
      const newPaymentStatus = orderData?.payment_status === 'paid' ? 'refunded' : orderData?.payment_status;

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: newPaymentStatus,
          cancellation_reason: cancelReason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Update delivery status if exists
      if (deliveryData?.id) {
        const { error: deliveryError } = await supabase
          .from("deliveries")
          .update({
            status: "cancelled",
          })
          .eq("id", deliveryData.id);

        if (deliveryError) console.error("Error updating delivery:", deliveryError);
      }

      toast.success("Order cancelled successfully");
      setCancelDialogOpen(false);
      setOrderStatus("cancelled");
      setProgress(0);
      navigate("/home");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // Handle modify order
  const handleModifyOrder = async () => {
    if (!modifyNote.trim()) {
      toast.error("Please specify what you'd like to modify");
      return;
    }

    try {
      setModifying(true);

      // Add modification note to customer_notes
      const currentNotes = orderData?.customer_notes || "";
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\n[MODIFICATION REQUEST]: ${modifyNote}`
        : `[MODIFICATION REQUEST]: ${modifyNote}`;

      const { error } = await supabase
        .from("orders")
        .update({
          customer_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Modification request sent to vendor! 📝");
      toast.info("The vendor will contact you shortly to confirm changes.");
      setModifyDialogOpen(false);
      setModifyNote("");
      
      // Refresh order data
      if (orderData) {
        setOrderData({
          ...orderData,
          customer_notes: updatedNotes,
        });
      }
    } catch (err) {
      console.error("Error modifying order:", err);
      toast.error("Failed to send modification request. Please try again.");
    } finally {
      setModifying(false);
    }
  };

  // ==== RENDERING ====

  if (isCreatingOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 animate-pulse">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Creating Your Order...</h2>
          <p className="text-muted-foreground">Please wait while we process your order</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 max-w-3xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link to="/account">Go to Orders</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 animate-pulse">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Loading Order...</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order #{orderId}</h1>
            <p className="text-sm text-muted-foreground">Track your order in real-time</p>
          </div>
        </div>

        {isDelivered ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6">
                <CheckCircle className="w-16 h-16 text-success" />
              </div>
              <h2 className="text-3xl font-bold mb-2">✅ Order Delivered!</h2>
              <p className="text-muted-foreground">
                Delivered at {new Date().toLocaleTimeString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total time: 15 minutes</p>
            </div>

            <Card className="p-6">
              {orderData.rated && reviewData ? (
                <div>
                  <h3 className="text-xl font-bold text-center mb-6">Your Review</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-center">Food Rating</Label>
                      <div className="flex justify-center gap-2 text-3xl">
                        {"⭐".repeat(Number(reviewData.food_rating) || 0)}
                        {"☆".repeat(5 - (Number(reviewData.food_rating) || 0))}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block text-center">Delivery Rating</Label>
                      <div className="flex justify-center gap-2 text-3xl">
                        {"⭐".repeat(Number(reviewData.delivery_rating) || 0)}
                        {"☆".repeat(5 - (Number(reviewData.delivery_rating) || 0))}
                      </div>
                    </div>
                    {reviewData.comment && (
                      <div>
                        <Label className="mb-2 block text-center">Your Comment</Label>
                        <p className="text-center text-muted-foreground p-4 bg-muted rounded-lg">
                          "{String(reviewData.comment)}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">
                      💚 You earned 8 loyalty points!
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-center mb-6">Rate Your Experience</h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">How was the food?</Label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFoodRating(star)}
                            className="text-3xl hover:scale-110 transition-transform"
                          >
                            {star <= foodRating ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                      {foodRating > 0 && (
                        <p className="text-center text-sm text-muted-foreground mt-1">
                          {foodRating === 5 ? "Excellent!" : foodRating >= 4 ? "Great!" : foodRating >= 3 ? "Good" : "Needs improvement"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="mb-2 block">How was delivery?</Label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDeliveryRating(star)}
                            className="text-3xl hover:scale-110 transition-transform"
                          >
                            {star <= deliveryRating ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                      {deliveryRating > 0 && (
                        <p className="text-center text-sm text-muted-foreground mt-1">
                          {deliveryRating === 5 ? "Excellent!" : deliveryRating >= 4 ? "Great!" : deliveryRating >= 3 ? "Good" : "Needs improvement"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="mb-2 block">Additional comments (optional)</Label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell us more about your experience..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      onClick={handleSubmitReview}
                      disabled={submittingReview || foodRating === 0 || deliveryRating === 0}
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </>
              )}
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/vendor/traditional-stews">Order Again</Link>
              </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // generate a printable receipt in a new window
                    const receiptWindow = window.open("", "_blank", "noopener,noreferrer,width=600,height=800");
                    if (!receiptWindow) {
                      toast.error("Could not open receipt window");
                      return;
                    }

                    const escHtml = (s: string | number | null | undefined): string => {
                      const str = String(s ?? "");
                      return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
                    };
                    const items = (orderData?.order_items || orderData?.items || []) as OrderItem[];
                    const itemsHtml = items
                      .map(
                        (it) =>
                          `<tr><td style="padding:6px 8px">${escHtml(it.quantity)} x ${escHtml(it.product_name)}</td><td style="padding:6px 8px;text-align:right">KSh ${escHtml(it.price)}</td></tr>`
                      )
                      .join("");

                    const subtotal = orderData ? orderData.total_amount - (deliveryData?.delivery_fee || 0) : 0;
                    const deliveryFee = deliveryData?.delivery_fee ?? 0;
                    const total = orderData?.total_amount ?? 0;

                    const html = `
                      <html>
                        <head>
                          <title>Receipt - Order ${orderId}</title>
                          <meta name="viewport" content="width=device-width,initial-scale=1" />
                          <style>
                            body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
                            .header{display:flex;justify-content:space-between;align-items:center}
                            h1{font-size:20px;margin:0}
                            table{width:100%;border-collapse:collapse;margin-top:16px}
                            td{border-bottom:1px solid #eee}
                            .summary{margin-top:12px}
                            .right{text-align:right}
                            .print-btn{display:inline-block;margin-top:16px;padding:8px 12px;border-radius:6px;background:#111;color:#fff;text-decoration:none}
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div>
                              <h1>Receipt</h1>
                              <div>Order #: ${escHtml(orderId)}</div>
                              <div>${escHtml(new Date().toLocaleString())}</div>
                            </div>
                            <div style="text-align:right">
                              <div>${escHtml(orderData?.vendor_name)}</div>
                              <div style="font-size:12px;color:#666">Delivery Address</div>
                              <div style="font-size:12px;color:#666">${escHtml(orderData?.delivery_address)}</div>
                            </div>
                          </div>

                          <table role="presentation">
                            <tbody>
                              ${itemsHtml}
                            </tbody>
                          </table>

                          <div class="summary">
                            <div style="display:flex;justify-content:space-between;padding:6px 0"><div>Subtotal</div><div>KSh ${subtotal}</div></div>
                            <div style="display:flex;justify-content:space-between;padding:6px 0"><div>Delivery Fee</div><div>KSh ${deliveryFee}</div></div>
                            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:bold;border-top:1px solid #ddd"><div>Total</div><div>KSh ${total}</div></div>
                          </div>

                          <div style="margin-top:10px;font-size:12px;color:#666">Payment: Confirmed</div>

                          <a href="#" onclick="window.print();return false;" class="print-btn">Print / Save PDF</a>
                        </body>
                      </html>
                    `;

                    receiptWindow.document.open();
                    receiptWindow.document.write(html);
                    receiptWindow.document.close();
                  }}
                >
                  View Receipt
                </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="relative overflow-hidden">
              {/* Category-specific hero image */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img 
                  src={getServiceImage(getCategoryMessaging(orderData?.category).imageSlug)}
                  alt="Order category"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background/90 backdrop-blur-sm mb-3 animate-bounce shadow-lg">
                    <span className="text-3xl">
                      {orderStatus === "pending"
                        ? "⏰"
                        : orderStatus === "accepted" || orderStatus === "preparing"
                        ? getCategoryMessaging(orderData?.category).icon
                        : "🚴"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 text-center -mt-2">
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  {orderStatus === "preparing" || orderStatus === "accepted"
                    ? getCategoryMessaging(orderData?.category).waitingHeadline
                    : getStatusLabel(orderStatus, orderData.isPremium)}
                </h2>
                <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                  {orderStatus === "pending" && "Your order will be confirmed shortly"}
                  {orderStatus === "accepted" && getCategoryMessaging(orderData?.category).waitingSubtext}
                  {orderStatus === "preparing" && getCategoryMessaging(orderData?.category).waitingSubtext}
                  {orderStatus === "ready" && "Your order is packed and ready for pickup!"}
                  {orderStatus === "in_transit" && "Almost there — your rider is on the way! 🏍️"}
                </p>

                {/* Category-specific waiting tip */}
                {(orderStatus === "pending" || orderStatus === "accepted" || orderStatus === "preparing") && (
                  <div className="inline-block bg-muted/60 backdrop-blur-sm rounded-lg px-4 py-2 text-xs sm:text-sm text-muted-foreground mb-4">
                    {getCategoryMessaging(orderData?.category).waitingTip}
                  </div>
                )}

                {lastUpdateTime && (
                  <Badge variant="secondary" className="mb-4">
                    Last updated: {lastUpdateTime}
                  </Badge>
                )}
                <Progress value={progress} className="h-2 mb-4" />
                
                {/* Notification toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="mt-2"
                >
                  {notificationsEnabled ? (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications On
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Notifications Off
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {orderStatus !== 'cancelled' && (
              <>
                {/* Enhanced Animated Timeline */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Order Timeline</h3>
                    <Badge variant="outline">Live Updates</Badge>
                  </div>
                  <div className="space-y-6 relative">
                    {(orderData.isPremium ? [
                      { label: "Order Placed", status: "pending", done: true, icon: "📝", description: "Your order has been received" },
                      { label: "Rider Found", status: "rider_assigned", done: ["rider_assigned", "rider_shopping", "purchased_at_carrefour", "in_transit", "delivered"].includes(orderStatus), icon: "🚴", description: "A rider has been assigned" },
                      { label: "Shopping", status: "rider_shopping", done: ["rider_shopping", "purchased_at_carrefour", "in_transit", "delivered"].includes(orderStatus), icon: "🛒", description: "Rider is shopping for your items" },
                      { label: "Purchased", status: "purchased_at_carrefour", done: ["purchased_at_carrefour", "in_transit", "delivered"].includes(orderStatus), icon: "🛍️", description: "Rider has purchased your items" },
                      { label: "Out for Delivery", status: "in_transit", done: ["in_transit", "delivered"].includes(orderStatus), icon: "🏍️", description: "Your order is on the way" },
                      { label: "Delivered", status: "delivered", done: orderStatus === "delivered", icon: "🎉", description: "Enjoy your items!" },
                    ] : [
                      { label: "Order Placed", status: "pending", done: true, icon: "📝", description: "Your order has been received" },
                      { label: "Vendor Confirmed", status: "accepted", done: ["accepted", "preparing", "ready", "in_transit", "delivered"].includes(orderStatus), icon: "✅", description: "Vendor accepted your order" },
                      { 
                        label: getCategoryMessaging(orderData?.category).timelineLabel, 
                        status: "preparing", 
                        done: ["preparing", "ready", "in_transit", "delivered"].includes(orderStatus), 
                        icon: getCategoryMessaging(orderData?.category).icon, 
                        description: getCategoryMessaging(orderData?.category).preparingDescription 
                      },
                      { label: "Ready for Pickup", status: "ready", done: ["ready", "in_transit", "delivered"].includes(orderStatus), icon: "📦", description: "Order is ready, waiting for rider" },
                      { label: "Out for Delivery", status: "in_transit", done: ["in_transit", "delivered"].includes(orderStatus), icon: "🏍️", description: "Rider is on the way to you" },
                      { label: "Delivered", status: "delivered", done: orderStatus === "delivered", icon: "🎉", description: getCategoryMessaging(orderData?.category).deliveredMessage },
                    ]).map((step, index, arr) => (
                      <div key={index} className="flex items-start gap-4 relative">
                        {index < arr.length - 1 && (
                          <div className={`absolute left-6 top-12 w-0.5 h-full transition-all duration-500 ${step.done ? "bg-green-500" : "bg-gray-200"}`} />
                        )}
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${step.done ? "bg-green-500 text-white ring-4 ring-green-100 shadow-lg scale-110" : "bg-gray-100 text-gray-400"} ${orderStatus === step.status && !step.done ? "animate-pulse ring-4 ring-primary/30" : ""}`}>
                          {step.icon}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold transition-colors ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                            {orderStatus === step.status && !step.done && (
                              <Badge className="animate-pulse">In Progress</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {step.description}
                          </p>
                          {step.done && orderData?.created_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(orderData.created_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Context-aware Action Buttons */}
                {getActionButtons(orderStatus).length > 0 && (
                  <Card className="p-3 sm:p-4">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">Quick Actions</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                      {getActionButtons(orderStatus).map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={index}
                            variant={action.variant || "outline"}
                            size="sm"
                            onClick={action.action}
                            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* E-Signature for Delivery Confirmation */}
                {orderStatus === "in_transit" && (
                  <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Pen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Ready to Receive?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          When your order arrives, confirm delivery with your e-signature
                        </p>
                        <Button 
                          onClick={() => setSignatureDialogOpen(true)}
                          className="w-full"
                        >
                          <Pen className="w-4 h-4 mr-2" />
                          Sign to Confirm Delivery
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {deliveryData?.rider_id && (
                  <Card className="p-6">
                    <h3 className="font-bold mb-4">Your Rider</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div>
                        <div className="font-semibold">Rider Assigned</div>
                        <div className="text-sm text-muted-foreground">⭐ On the way</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Rider
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}

            <Card className="p-6">
              <h3 className="font-bold mb-4">Your Order</h3>
              <p className="text-sm text-muted-foreground mb-2">From: {orderData.vendor_name || "Vendor"}</p>
              <ul className="space-y-1 text-sm mb-4">
                {(orderData.order_items || orderData.items || []).map((item: OrderItem) => (
                  <li key={item.id}>
                    • {item.quantity}x {item.product_name} (KSh {item.price})
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>KSh {orderData.total_amount - (deliveryData?.delivery_fee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>KSh {deliveryData?.delivery_fee || 0}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>KSh {orderData.total_amount}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">Payment: Confirmed</div>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help?</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/support-live-chat")}>
                  Chat with Support
                </Button>
                <Button variant="outline" size="sm">
                  Call Support
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* E-Signature Dialog */}
        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delivery</DialogTitle>
              <DialogDescription>
                Please sign below to confirm you've received your order in good condition.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="mb-2 block">Your Full Name (Signature)</Label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={confirmingDelivery}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will serve as your digital signature
                </p>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">By signing, you confirm:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Order received in good condition</li>
                  <li>✓ All items are correct</li>
                  <li>✓ No missing or damaged items</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSignatureDialogOpen(false)}
                  disabled={confirmingDelivery}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelivery}
                  disabled={!signature.trim() || confirmingDelivery}
                  className="flex-1"
                >
                  {confirmingDelivery ? "Confirming..." : "Confirm Delivery"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Cancel Order</DialogTitle>
              <DialogDescription className="text-sm">
                Are you sure? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
              <div>
                <Label className="mb-1.5 sm:mb-2 block text-sm">Reason for cancellation</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling? (optional)"
                  className="min-h-[80px] sm:min-h-[100px] text-sm"
                  disabled={cancelling}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  e.g., Changed my mind, Ordered by mistake
                </p>
              </div>

              <div className="bg-destructive/10 p-2 sm:p-3 rounded-lg text-xs sm:text-sm border border-destructive/20">
                <p className="font-medium mb-1 text-destructive text-sm sm:text-base">⚠️ Please note:</p>
                <ul className="space-y-0.5 sm:space-y-1 text-muted-foreground text-xs">
                  <li>• Order will be cancelled immediately</li>
                  <li>• Refund may take 3-5 business days</li>
                  <li>• The vendor will be notified</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                  disabled={cancelling}
                  className="flex-1 text-sm"
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 text-sm"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modify Order Dialog */}
        <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modify Order</DialogTitle>
              <DialogDescription>
                Request changes to your order. The vendor will review and contact you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="mb-2 block">What would you like to change?</Label>
                <Textarea
                  value={modifyNote}
                  onChange={(e) => setModifyNote(e.target.value)}
                  placeholder="E.g., Add 2 more items, Remove side dish, Change spice level, etc."
                  className="min-h-[120px]"
                  disabled={modifying}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific about what you want to add, remove, or change
                </p>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg text-sm border border-primary/20">
                <p className="font-medium mb-1">📝 How it works:</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Your request will be sent to the vendor</li>
                  <li>• The vendor will review and may call you to confirm</li>
                  <li>• Changes depend on order status and availability</li>
                  <li>• Price may be adjusted if items are added</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModifyDialogOpen(false)}
                  disabled={modifying}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleModifyOrder}
                  disabled={!modifyNote.trim() || modifying}
                  className="flex-1"
                >
                  {modifying ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrderTracking;

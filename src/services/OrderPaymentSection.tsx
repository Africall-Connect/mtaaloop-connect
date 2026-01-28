import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { retryPaystackPayment } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Payment {
  id: string;
  status: "initiated" | "pending" | "successful" | "failed" | "cancelled";
  provider: string;
}

function OrderPaymentSection({ orderId }: { orderId: string }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const loadPayment = async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, status, provider")
        .eq("order_id", orderId)
        .eq("provider", "paystack")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn("No payment record yet:", error.message);
        return;
      }

      setPayment(data as Payment);
    };

    loadPayment();
  }, [orderId]);

  const handleRetry = async () => {
    setLoading(true);
    const result = await retryPaystackPayment(orderId);
    if (!result.success && result.message) {
      toast.error(result.message);
    }
    setLoading(false);
  };

  if (!payment) {
    return <div className="text-sm text-muted-foreground">No payment record yet.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        Payment status: <span className="font-semibold capitalize">{payment.status}</span>
      </div>

      {(payment.status === "failed" || payment.status === "pending" || payment.status === "cancelled") && (
        <Button onClick={handleRetry} disabled={loading}>
          {loading ? "Retrying..." : "Retry Payment"}
        </Button>
      )}

      {payment.status === "successful" && <div className="text-sm text-green-600">✅ Payment successful</div>}
    </div>
  );
}

export default OrderPaymentSection;
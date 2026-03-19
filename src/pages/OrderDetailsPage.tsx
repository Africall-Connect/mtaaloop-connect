import { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "loaded">("loading");
  const [order, setOrder] = useState<any | null>(null);
  const { user } = useAuth();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const handleCreateDispute = async () => {
    if (!user || !order) return;
    if (!reason.trim()) {
      toast.error("Please enter a reason for the dispute.");
      return;
    }

    setSubmittingDispute(true);
    try {
      const { error } = await supabase.from("order_disputes").insert({
        order_id: order.id,
        raised_by: user.id,
        role: "customer",
        reason,
        details: details || null,
      });

      if (error) {
        console.error("[OrderDetails] Dispute create error:", error);
        toast.error("Failed to submit dispute. Please try again.");
        return;
      }

      toast.success("Your issue has been submitted. Our team will review it.");
      setShowDisputeForm(false);
      setReason("");
      setDetails("");
    } finally {
      setSubmittingDispute(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setStatus("loading");
      const { data: orderData } = await supabase.from("orders").select("*").eq("id", orderId).single();

      if (orderData) {
        setOrder(orderData);
      }
      setStatus("loaded");
    };
    fetchOrder();
  }, [orderId, searchParams]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Order Details</h1>
      {status === "loading" && <p>Loading order...</p>}
      {order && (
        <div>
          <pre className="mt-4 p-4 bg-muted rounded"><code>{JSON.stringify(order, null, 2)}</code></pre>

          <div className="mt-6 border-t pt-4">
            {!showDisputeForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisputeForm(true)}
              >
                Report an issue with this order
              </Button>
            ) : (
              <div className="space-y-3 p-3 border rounded-md mt-2">
                <Textarea
                  placeholder="Describe what went wrong (e.g. delivered but not paid, wrong items, etc.)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Textarea
                  placeholder="More details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDisputeForm(false);
                      setReason("");
                      setDetails("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateDispute}
                    disabled={submittingDispute}
                  >
                    {submittingDispute ? "Submitting..." : "Submit Issue"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;

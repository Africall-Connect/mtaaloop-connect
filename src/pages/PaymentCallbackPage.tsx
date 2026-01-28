import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type VerifyStatus = "success" | "pending" | "failed" | "not_found" | "error";

interface VerifyResponse {
  status: VerifyStatus;
  message?: string;
  payment?: {
    id: string;
    order_id: string | null;
    status: string;
    amount: number;
    provider_reference: string;
  };
  order?: {
    id: string;
    status: string;
    payment_status?: string;
    paid_at?: string;
    total_amount?: number;
  };
}

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const reference = searchParams.get("reference");
  const statusParam = searchParams.get("status"); // Paystack may send ?status=success|failed

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        setResult({
          status: "error",
          message: "Missing payment reference in URL.",
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("payments-verify", {
          body: { reference },
        });

        if (error) {
          console.error("payments-verify error", error);
          setResult({
            status: "error",
            message: "Unable to verify payment. Please contact support.",
          });
        } else {
          setResult(data as VerifyResponse);
        }
      } catch (err) {
        console.error("Unexpected verify error", err);
        setResult({
          status: "error",
          message: "Unexpected error verifying payment.",
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [reference]);

  const primaryStatus: VerifyStatus =
    result?.status ??
    // fallback: if Paystack sent status=success but we don't have result yet
    ((statusParam as VerifyStatus) || "pending");

  const orderId = result?.order?.id ?? result?.payment?.order_id ?? null;
  const amount = result?.payment?.amount ?? result?.order?.total_amount ?? undefined;

  const goToOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate("/orders");
    }
  };

  const goHome = () => navigate("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 space-y-6 text-center">
        {loading ? (
          <>
            <div className="flex justify-center mb-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Verifying your payment...</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your transaction with Paystack.
            </p>
          </>
        ) : (
          <>
            {/* Icon + title */}
            {primaryStatus === "success" && (
              <>
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-xl font-semibold">Payment successful 🎉</h1>
              </>
            )}

            {primaryStatus === "pending" && (
              <>
                <div className="flex justify-center mb-2">
                  <AlertCircle className="h-10 w-10 text-yellow-500" />
                </div>
                <h1 className="text-xl font-semibold">Payment still processing</h1>
              </>
            )}

            {(primaryStatus === "failed" ||
              primaryStatus === "not_found" ||
              primaryStatus === "error") && (
              <>
                <div className="flex justify-center mb-2">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-xl font-semibold">Payment not completed</h1>
              </>
            )}

            {/* Message */}
            <p className="text-sm text-muted-foreground">
              {result?.message ??
                (primaryStatus === "success"
                  ? "We’ve confirmed your payment and your order is now being processed."
                  : primaryStatus === "pending"
                  ? "We haven’t fully confirmed the payment yet. If you were charged, it should update shortly."
                  : "We couldn't confirm this payment. If you were charged, please contact support.")}
            </p>

            {/* Summary */}
            <div className="mt-4 border rounded-lg p-3 text-left text-sm space-y-1">
              {reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-xs">{reference}</span>
                </div>
              )}
              {amount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">KSh {amount}</span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-xs">{orderId}</span>
                </div>
              )}
              {result?.order?.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status:</span>
                  <span className="font-semibold">{result.order.status}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-4">
              {primaryStatus === "success" && (
                <Button onClick={goToOrder} className="w-full">
                  View Order
                </Button>
              )}

              {primaryStatus === "pending" && (
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Refresh Status
                </Button>
              )}

              {(primaryStatus === "failed" ||
                primaryStatus === "not_found" ||
                primaryStatus === "error") && (
                <Button onClick={goHome} className="w-full">
                  Go back home
                </Button>
              )}

              {primaryStatus !== "success" && orderId && (
                <Button variant="ghost" onClick={goToOrder} className="w-full text-xs">
                  View order details anyway
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentCallbackPage;

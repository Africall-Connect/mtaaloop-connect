import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type StatusState = "loading" | "success" | "failed";

const PaystackCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref"); // sometimes Paystack uses trxref
  const ref = reference || trxref;

  const [status, setStatus] = useState<StatusState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!ref) {
      setStatus("failed");
      setErrorMessage("Missing payment reference.");
      return;
    }

    const verifyPayment = async () => {
      try {
        // Small delay so webhook has time to update DB
        await new Promise((res) => setTimeout(res, 1500));

        const { data, error } = await supabase
          .from("orders")
          .select("id, payment_status")
          .eq("id", ref)
          .single();

        if (error) {
          console.error("[PaystackCallback] Verification error:", error);
          setStatus("failed");
          setErrorMessage("Could not verify payment.");
          return;
        }

        if (data.payment_status === "paid") {
          setStatus("success");
          setTimeout(() => {
            navigate(`/orders/${data.id}`);
          }, 1500);
        } else {
          setStatus("failed");
          setErrorMessage(
            data.payment_status === "failed"
              ? "Payment failed or was cancelled."
              : "Payment not completed yet."
          );
        }
      } catch (err) {
        console.error("[PaystackCallback] Unexpected error:", err);
        setStatus("failed");
        setErrorMessage("Unexpected error verifying payment.");
      }
    };

    verifyPayment();
  }, [ref, navigate]);

  const handleRetryPayment = async () => {
    if (!ref) return;
    setIsRetrying(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "payments-paystack-init",
        {
          body: { order_id: ref },
        }
      );

      if (error) {
        console.error("[PaystackCallback] Retry init error:", error);
        setErrorMessage("Failed to restart payment. Please try again.");
        setIsRetrying(false);
        return;
      }

      const { authorization_url } = data as {
        authorization_url?: string;
        reference?: string;
      };

      if (!authorization_url) {
        setErrorMessage(
          "Payment retry could not be initialized. Contact support."
        );
        setIsRetrying(false);
        return;
      }

      window.location.href = authorization_url;
    } catch (err) {
      console.error("[PaystackCallback] Retry unexpected error:", err);
      setErrorMessage("Unexpected error restarting payment.");
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {status === "loading" && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce delay-150" />
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce delay-300" />
          </div>
          <h2 className="text-2xl font-bold">Verifying your payment…</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Please wait while we confirm your payment with Paystack. This
            usually takes a few seconds.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-2xl font-bold text-green-600">
            Payment successful!
          </h2>
          <p className="text-sm text-muted-foreground">
            Redirecting you to your order details…
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600">
            We couldn&apos;t verify your payment
          </h2>
          {errorMessage && (
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={handleRetryPayment}
              disabled={isRetrying || !ref}
              className="w-full"
            >
              {isRetrying ? "Reopening Paystack…" : "Retry Payment"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/orders")}
            >
              Go to My Orders
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaystackCallback;
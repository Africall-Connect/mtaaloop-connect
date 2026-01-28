import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const orderId = params.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-6 shadow-lg border border-red-200">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-red-600">
          Payment Failed
        </h1>

        <p className="text-muted-foreground text-sm">
          Unfortunately, we were unable to process your payment.
          You can retry the payment or check your order details.
        </p>

        <div className="space-y-3 mt-6">

          <Button
            className="w-full"
            variant="default"
            onClick={() => {
              if (!orderId) return navigate("/");
              navigate(`/checkout?retry_order=${orderId}`);
            }}
          >
            Try Again
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              if (!orderId) return navigate("/");
              navigate(`/orders/${orderId}`);
            }}
          >
            View Order
          </Button>

          <Button
            className="w-full"
            variant="ghost"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>

        {orderId && (
          <p className="text-xs text-muted-foreground mt-4">
            Order ID: {orderId}
          </p>
        )}
      </Card>
    </div>
  );
};

export default PaymentFailed;
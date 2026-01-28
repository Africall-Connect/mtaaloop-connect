import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  description: string;
}

const PromoCodeInput = ({
  subtotal,
  onApply,
  onRemove
}: {
  subtotal: number;
  onApply: (promo: PromoCode) => void;
  onRemove: () => void;
}) => {
  const [code, setCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Mock promo codes for demo
  const validCodes: Record<string, PromoCode> = {
    'WELCOME10': { code: 'WELCOME10', discount: 10, type: 'percentage', description: '10% off first order' },
    'SAVE50': { code: 'SAVE50', discount: 50, type: 'fixed', description: 'KSh 50 off' },
    'MTAA20': { code: 'MTAA20', discount: 20, type: 'percentage', description: '20% off for MtaaLoop members' }
  };

  const validateCode = async () => {
    if (!code.trim()) return;

    setIsValidating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const upperCode = code.toUpperCase();
    const promo = validCodes[upperCode];

    if (promo) {
      setAppliedPromo(promo);
      onApply(promo);
      toast.success(`Promo code applied! ${promo.description}`);
    } else {
      toast.error("Invalid promo code");
    }

    setIsValidating(false);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setCode("");
    onRemove();
    toast.info("Promo code removed");
  };

  const calculateDiscount = (promo: PromoCode) => {
    if (promo.type === 'percentage') {
      return Math.round((subtotal * promo.discount) / 100);
    }
    return Math.min(promo.discount, subtotal);
  };

  return (
    <Card className="p-4 space-y-4">
      <Label className="text-base font-semibold">🎟️ Promo Code</Label>

      {!appliedPromo ? (
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && validateCode()}
          />
          <Button
            onClick={validateCode}
            disabled={!code.trim() || isValidating}
            variant="outline"
          >
            {isValidating ? "..." : "Apply"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <Badge variant="secondary" className="font-mono">
                {appliedPromo.code}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {appliedPromo.description} • Save KSh {calculateDiscount(appliedPromo)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removePromo}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        💡 Try: WELCOME10, SAVE50, or MTAA20
      </div>
    </Card>
  );
};

export default PromoCodeInput;

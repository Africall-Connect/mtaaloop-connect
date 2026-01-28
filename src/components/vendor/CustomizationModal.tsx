import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MenuItem } from "@/data/vendors";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface CustomizationModalProps {
  item: MenuItem;
  vendorId: string;
  vendorName: string;
  open: boolean;
  onClose: () => void;
}

export const CustomizationModal = ({
  item,
  vendorId,
  vendorName,
  open,
  onClose,
}: CustomizationModalProps) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState("Medium");
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  const calculateTotal = () => {
    let total = item.price * quantity;
    
    if (item.customizations?.proteins) {
      selectedProteins.forEach((proteinName) => {
        const protein = item.customizations!.proteins!.find((p) => p.name === proteinName);
        if (protein) total += protein.price * quantity;
      });
    }
    
    if (item.customizations?.sides) {
      selectedSides.forEach((sideName) => {
        const side = item.customizations!.sides!.find((s) => s.name === sideName);
        if (side) total += side.price * quantity;
      });
    }
    
    return total;
  };

  const handleAddToCart = () => {
    const customizations: Record<string, unknown> = {};
    
    if (spiceLevel) customizations.spiceLevel = spiceLevel;
    if (selectedProteins.length > 0) customizations.protein = selectedProteins;
    if (selectedSides.length > 0) customizations.sides = selectedSides;
    if (instructions) customizations.instructions = instructions;

    addItem({
      id: `${item.id}-${Date.now()}`,
      vendorId,
      vendorName,
      name: item.name,
      price: calculateTotal() / quantity,
      quantity,
      image: item.image,
      customizations: Object.keys(customizations).length > 0 ? customizations : undefined,
    });

    toast.success("Added to cart!", {
      description: `${quantity}x ${item.name}`,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {item.image && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <p className="text-muted-foreground mb-2">{item.description}</p>
            <p className="text-lg font-semibold text-primary">Base Price: KSh {item.price}</p>
          </div>

          {/* Spice Level */}
          {item.customizations?.spiceLevels && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">🌶️ Spice Level</Label>
              <p className="text-sm text-muted-foreground">Choose how hot you want it:</p>
              <RadioGroup value={spiceLevel} onValueChange={setSpiceLevel}>
                {item.customizations.spiceLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="cursor-pointer">
                      {level}
                      {level === "Mild" && " (No chili - Family friendly)"}
                      {level === "Medium" && " (Recommended - Balanced)"}
                      {level === "Hot" && " (Extra chili - Spicy!)"}
                      {level === "Extra Hot" && " (Pilipili pili pili 🔥)"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Proteins */}
          {item.customizations?.proteins && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">🍖 Add Protein</Label>
              <p className="text-sm text-muted-foreground">Make it a complete meal:</p>
              {item.customizations.proteins.map((protein) => (
                <div key={protein.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={protein.name}
                    checked={selectedProteins.includes(protein.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProteins([...selectedProteins, protein.name]);
                      } else {
                        setSelectedProteins(selectedProteins.filter((p) => p !== protein.name));
                      }
                    }}
                  />
                  <Label htmlFor={protein.name} className="cursor-pointer">
                    {protein.name} (+KSh {protein.price})
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Sides */}
          {item.customizations?.sides && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">🥗 Side Additions</Label>
              {item.customizations.sides.map((side) => (
                <div key={side.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={side.name}
                    checked={selectedSides.includes(side.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSides([...selectedSides, side.name]);
                      } else {
                        setSelectedSides(selectedSides.filter((s) => s !== side.name));
                      }
                    }}
                  />
                  <Label htmlFor={side.name} className="cursor-pointer">
                    {side.name} (+KSh {side.price})
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">📝 Special Instructions (Optional)</Label>
            <Textarea
              placeholder='Example: "Please make it extra hot" or "No onions please"'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{instructions.length}/200 characters</p>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">🍽️ Quantity</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold">TOTAL:</span>
              <span className="text-2xl font-bold text-primary">KSh {calculateTotal()}</span>
            </div>

            <Button className="w-full" size="lg" onClick={handleAddToCart}>
              Add to Cart - KSh {calculateTotal()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

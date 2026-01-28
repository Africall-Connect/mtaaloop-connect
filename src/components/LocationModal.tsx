import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Clock } from "lucide-react";

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LocationModal = ({ open, onOpenChange }: LocationModalProps) => {
  const [step, setStep] = useState<"location" | "radius">("location");
  const [selectedRadius, setSelectedRadius] = useState<500 | 1000 | 3000>(1000);

  const radiusOptions = [
    { distance: 500, time: "5-7 min", vendors: 12 },
    { distance: 1000, time: "8-12 min", vendors: 34 },
    { distance: 3000, time: "12-15 min", vendors: 89 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "location" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">👋 Welcome to MtaaLoop!</DialogTitle>
              <DialogDescription>
                Let's find what's near you
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                <div className="relative z-10 text-center space-y-2">
                  <MapPin className="w-16 h-16 text-primary mx-auto animate-bounce" />
                  <p className="text-sm text-muted-foreground">Interactive map coming soon</p>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setStep("radius")}
              >
                <Navigation className="mr-2 h-5 w-5" />
                Use My Current Location
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  placeholder="Search: Estate, Street, Area..." 
                  className="h-12"
                />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">Examples:</p>
                  <ul className="space-y-1 pl-4">
                    <li>• Kilimani, Nairobi</li>
                    <li>• Westlands, Ring Road</li>
                    <li>• Embakasi, Near Fedha Estate</li>
                  </ul>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setStep("radius")}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "radius" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Adjust Your Radius</DialogTitle>
              <DialogDescription>
                Choose how far you want to search
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                {radiusOptions.map((option) => (
                  <button
                    key={option.distance}
                    onClick={() => setSelectedRadius(option.distance as 500 | 1000 | 3000)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                      ${selectedRadius === option.distance 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${selectedRadius === option.distance ? 'border-primary' : 'border-muted'}
                        `}>
                          {selectedRadius === option.distance && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{option.distance}m radius</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {option.time}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{option.vendors}</div>
                        <div className="text-xs text-muted-foreground">vendors</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">💡</span>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Smaller radius = Faster delivery!</p>
                    <p className="text-muted-foreground">
                      You can always adjust this later in settings.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  onOpenChange(false);
                  // In a real app, this would save the location and redirect
                }}
              >
                Show Me Options
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { 
  Waves, 
  Dumbbell, 
  Baby, 
  Shield, 
  Car, 
  Home, 
  Zap, 
  Droplet, 
  Video,
  Trees,
  Wifi,
  UtensilsCrossed,
  ShoppingBag,
  HeartPulse,
  Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AVAILABLE_AMENITIES = [
  { id: "swimming_pool", label: "Swimming Pool", icon: Waves, color: "text-blue-500" },
  { id: "gym", label: "Gym & Fitness Center", icon: Dumbbell, color: "text-red-500" },
  { id: "playground", label: "Children's Playground", icon: Baby, color: "text-yellow-500" },
  { id: "24h_security", label: "24/7 Security", icon: Shield, color: "text-green-500" },
  { id: "parking", label: "Covered Parking", icon: Car, color: "text-gray-500" },
  { id: "clubhouse", label: "Clubhouse", icon: Home, color: "text-purple-500" },
  { id: "backup_generator", label: "Backup Generator", icon: Zap, color: "text-orange-500" },
  { id: "water_supply", label: "Borehole Water", icon: Droplet, color: "text-cyan-500" },
  { id: "cctv", label: "CCTV Surveillance", icon: Video, color: "text-indigo-500" },
  { id: "garden", label: "Landscaped Gardens", icon: Trees, color: "text-green-600" },
  { id: "wifi", label: "High-Speed Fiber", icon: Wifi, color: "text-blue-600" },
  { id: "restaurant", label: "Restaurant/Cafe", icon: UtensilsCrossed, color: "text-amber-500" },
  { id: "shopping", label: "On-site Shopping", icon: ShoppingBag, color: "text-pink-500" },
  { id: "medical", label: "Medical Clinic", icon: HeartPulse, color: "text-red-600" }
];

interface AmenityPickerProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenityPicker({ selectedAmenities, onChange }: AmenityPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedAmenities = showAll ? AVAILABLE_AMENITIES : AVAILABLE_AMENITIES.slice(0, 8);

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter(id => id !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  const selectAll = () => {
    onChange(AVAILABLE_AMENITIES.map(a => a.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Estate Amenities</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Select all amenities available in your estate
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={selectedAmenities.length === 0}
          >
            Clear All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={selectedAmenities.length === AVAILABLE_AMENITIES.length}
          >
            Select All
          </Button>
        </div>
      </div>

      {selectedAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAmenities.map(id => {
            const amenity = AVAILABLE_AMENITIES.find(a => a.id === id);
            if (!amenity) return null;
            const Icon = amenity.icon;
            return (
              <Badge
                key={id}
                variant="default"
                className="px-3 py-2 cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleAmenity(id)}
              >
                <Icon className="h-3 w-3 mr-1.5" />
                {amenity.label}
                <Check className="h-3 w-3 ml-1.5" />
              </Badge>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayedAmenities.map(amenity => {
          const Icon = amenity.icon;
          const isSelected = selectedAmenities.includes(amenity.id);
          
          return (
            <Card
              key={amenity.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "border-2 border-primary bg-primary/5 shadow-sm"
                  : "border hover:border-primary/50"
              }`}
              onClick={() => toggleAmenity(amenity.id)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full ${
                    isSelected ? "bg-primary" : "bg-muted"
                  } flex items-center justify-center transition-colors`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      isSelected ? "text-primary-foreground" : amenity.color
                    }`}
                  />
                </div>
                <p className={`text-xs font-medium ${isSelected ? "text-primary" : ""}`}>
                  {amenity.label}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {!showAll && AVAILABLE_AMENITIES.length > 8 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Show {AVAILABLE_AMENITIES.length - 8} More Amenities
        </Button>
      )}

      {showAll && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(false)}
        >
          Show Less
        </Button>
      )}
    </div>
  );
}

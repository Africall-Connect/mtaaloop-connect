import { useState } from "react";
import { MapPin, Locate, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MapSelectorProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialAddress?: string;
}

export function MapSelector({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  initialAddress,
}: MapSelectorProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || "");
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        
        // In a real implementation, you would use reverse geocoding here
        // For now, we'll just set a placeholder
        const estimatedAddress = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAddress(estimatedAddress);
        
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: estimatedAddress,
        });
        
        setLoading(false);
        toast.success("Location detected successfully!");
      },
      (error) => {
        setLoading(false);
        toast.error("Unable to get your location. Please enter manually.");
        console.error(error);
      }
    );
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }

    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });

    toast.success("Location updated!");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Estate Location
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pin your estate's exact location on the map
        </p>
      </div>

      {/* Map Placeholder - In production, integrate Google Maps or Leaflet */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Interactive Map Coming Soon</p>
            <p className="text-xs text-muted-foreground">
              Use GPS location or enter coordinates manually
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full max-w-xs"
          >
            <Locate className="h-4 w-4 mr-2" />
            {loading ? "Detecting Location..." : "Use My Current Location"}
          </Button>
        </div>
      </Card>

      {/* Manual Coordinate Entry */}
      <Card className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              placeholder="e.g., -1.286389"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Between -90 and 90</p>
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              placeholder="e.g., 36.817223"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Between -180 and 180</p>
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="address">Address (Optional)</Label>
          <Input
            id="address"
            placeholder="Estate address or landmark"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-4"
          onClick={handleManualUpdate}
          disabled={!latitude || !longitude}
        >
          Update Location
        </Button>
      </Card>

      {latitude && longitude && (
        <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Location Set
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {address || `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

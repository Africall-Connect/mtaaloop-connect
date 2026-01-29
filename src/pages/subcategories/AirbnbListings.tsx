import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { getVendorsByCategory } from "@/data/vendors";

const AirbnbListings = () => {
  const navigate = useNavigate();
  const vendors = getVendorsByCategory("Airbnb Listings");

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Home className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Airbnb Listings</h1>
              <p className="text-muted-foreground">Short-term rentals nearby</p>
            </div>
          </div>
        </div>

        <VendorListingGrid vendors={vendors} />
      </div>
    </div>
  );
};

export default AirbnbListings;

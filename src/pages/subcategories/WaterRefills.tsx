import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { getVendorsByCategory } from "@/data/vendors";

const WaterRefills = () => {
  const navigate = useNavigate();
  const vendors = getVendorsByCategory("Water Refills");

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">💧 Water Refills</h1>
            <p className="text-muted-foreground">Clean drinking water delivered</p>
          </div>
        </div>

        <VendorListingGrid vendors={vendors} />
      </div>
    </div>
  );
};

export default WaterRefills;

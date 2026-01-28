import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { getVendorsByCategory } from "@/data/vendors";

const EventPlanning = () => {
  const navigate = useNavigate();
  const vendors = getVendorsByCategory("Event Planning Services");

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🎪 Event Planning Services</h1>
            <p className="text-muted-foreground">Making your events memorable</p>
          </div>
        </div>

        <VendorListingGrid vendors={vendors} />
      </div>
    </div>
  );
};

export default EventPlanning;

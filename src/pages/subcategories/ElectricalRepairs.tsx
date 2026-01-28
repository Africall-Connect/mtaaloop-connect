import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { getVendorsByCategory, getVendorById } from "@/data/vendors";

const ElectricalRepairs = () => {
  const navigate = useNavigate();
  // Show only the specific vendor that offers electrical repair services
  const vendors = [getVendorById("electrical-experts")].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/repairs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">⚡ Electrical Repairs</h1>
            <p className="text-muted-foreground">Wiring, outlets, switches, lighting fixtures</p>
          </div>
        </div>

        <VendorListingGrid vendors={vendors} />
      </div>
    </div>
  );
};

export default ElectricalRepairs;

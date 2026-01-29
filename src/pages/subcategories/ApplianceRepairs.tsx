import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorListingGrid } from "@/components/VendorListingGrid";
import { getVendorsByCategory, getVendorById } from "@/data/vendors";

const ApplianceRepairs = () => {
  const navigate = useNavigate();
  // Show only the specific vendor that offers appliance repair services
  const vendors = [getVendorById("appliance-doctor")].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/repairs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Plug className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Appliance Repairs</h1>
              <p className="text-muted-foreground">Fridges, TVs, microwaves, washing machines</p>
            </div>
          </div>
        </div>

        <VendorListingGrid vendors={vendors} />
      </div>
    </div>
  );
};

export default ApplianceRepairs;

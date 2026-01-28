import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VendorProfile } from "@/types/database";
import VendorProfileGrid from "@/components/VendorProfileGrid";
import { Pill } from "lucide-react";

const PharmacyPage = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPharmacyVendors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vendor_profiles")
          .select("*")
          .eq("business_type", "pharmacy")
          .eq("is_approved", true)
          .eq("is_active", true);

        if (error) {
          throw error;
        }

        setVendors(data || []);
      } catch (err) {
        const e = err as Error;
        console.error("Error fetching pharmacy vendors:", e);
        setError("Failed to load vendors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyVendors();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Pill className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Pharmacy</h1>
          <p className="text-muted-foreground">
            Find pharmacies, supplements, and personal care products.
          </p>
        </div>
      </div>

      <VendorProfileGrid
        vendors={vendors}
        loading={loading}
        error={error}
        category="pharmacy"
      />
    </div>
  );
};

export default PharmacyPage;

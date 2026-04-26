import { useState, useEffect, useMemo } from "react";
import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConsultationBookingFlow } from "@/components/pharmacy/ConsultationBookingFlow";
import { ConsultationType } from "@/types/consultation";
import { Pill, CalendarClock, Stethoscope, Clock, ArrowRight } from "lucide-react";
import { PharmacyHero } from "@/components/vendor/pharmacy/PharmacyHero";
import { PharmacyStory } from "@/components/vendor/pharmacy/PharmacyStory";
import { PharmacyProductCard } from "@/components/vendor/pharmacy/PharmacyProductCard";
import { PharmacyStickyUploadBar } from "@/components/vendor/pharmacy/PharmacyStickyUploadBar";

interface PharmacyViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

// Render order for symptom sections
const SYMPTOM_ORDER: Array<{ key: string; label: string }> = [
  { key: "cold-flu", label: "Cold & Flu" },
  { key: "pain-relief", label: "Pain Relief" },
  { key: "baby-care", label: "Baby Care" },
  { key: "first-aid", label: "First Aid" },
  { key: "chronic-care", label: "Chronic Care" },
  { key: "vitamins", label: "Vitamins" },
  { key: "personal-care", label: "Personal Care" },
  { key: "other", label: "Other" },
];

export function PharmacyView({ vendor, products }: PharmacyViewProps) {
  const [activeTab, setActiveTab] = useState<string>("products");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Only show inventory products (not bookings)
  const inventoryProducts = useMemo(
    () => products.filter((p) => p.item_type !== "booking"),
    [products]
  );

  // Group inventory products by symptom_category
  const groupedBySymptom = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    for (const p of inventoryProducts) {
      const key = (p.symptom_category as string) || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [inventoryProducts]);

  useEffect(() => {
    const fetchConsultationTypes = async () => {
      const { data, error } = await supabase
        .from("consultation_types")
        .select("*")
        .eq("vendor_id", vendor.id)
        .eq("is_active", true);

      if (!error && data) {
        setConsultationTypes(data as unknown as ConsultationType[]);
      }
    };
    fetchConsultationTypes();
  }, [vendor.id]);

  const handleAddProduct = (product: Product) => {
    addItem({
      id: product.id,
      vendorId: vendor.id,
      vendorName: vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url,
    });
    toast({
      title: "Added to cart",
      description: `1x ${product.name}`,
    });
  };

  const hasConsultations = consultationTypes.length > 0;
  const hasAnyProducts = inventoryProducts.length > 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Pharmacy hero — replaces the generic banner */}
      <PharmacyHero vendor={vendor} />

      {/* Vendor story strip */}
      <PharmacyStory vendor={vendor} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="products" className="gap-2">
            <Pill className="h-4 w-4" />
            Shop Products
          </TabsTrigger>
          <TabsTrigger value="consultations" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Book Consultation
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-0">
          {hasAnyProducts ? (
            SYMPTOM_ORDER.map(({ key, label }) => {
              const items = groupedBySymptom[key];
              if (!items || items.length === 0) return null;
              return (
                <section key={key} className="mb-12">
                  <header className="mb-5">
                    <h3
                      className="text-xl md:text-2xl font-medium tracking-tight"
                      style={{
                        fontFamily: "var(--vendor-font-display)",
                        color: "var(--vendor-primary)",
                      }}
                    >
                      {label}
                    </h3>
                    <div
                      className="mt-2 h-px w-full"
                      style={{
                        background:
                          "color-mix(in srgb, var(--vendor-primary) 10%, transparent)",
                      }}
                    />
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {items.map((product) => (
                      <PharmacyProductCard
                        key={product.id}
                        product={product}
                        onAdd={handleAddProduct}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div
              className="text-center py-20 rounded-xl border"
              style={{
                background: "var(--vendor-surface)",
                borderColor:
                  "color-mix(in srgb, var(--vendor-primary) 15%, transparent)",
                color: "var(--vendor-primary)",
              }}
            >
              <p className="max-w-md mx-auto">
                No medicines in your cart yet. A pharmacist is on duty if you
                need advice.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="mt-0">
          {hasConsultations ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3
                  className="text-2xl font-medium flex items-center gap-2"
                  style={{
                    fontFamily: "var(--vendor-font-display)",
                    color: "var(--vendor-primary)",
                  }}
                >
                  <Stethoscope
                    className="h-5 w-5"
                    style={{ color: "var(--vendor-primary)" }}
                  />
                  Available Consultations
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consultationTypes.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="bg-card border rounded-xl p-6 transition-colors"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--vendor-primary) 10%, transparent)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="p-3 rounded-full shrink-0"
                        style={{
                          background:
                            "color-mix(in srgb, var(--vendor-primary) 10%, transparent)",
                        }}
                      >
                        <Stethoscope
                          className="h-6 w-6"
                          style={{ color: "var(--vendor-primary)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-lg">{consultation.name}</h4>
                          {consultation.requires_prescription && (
                            <Badge variant="outline" className="shrink-0 gap-1">
                              <Pill className="h-3 w-3" />
                              Rx
                            </Badge>
                          )}
                        </div>
                        {consultation.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {consultation.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {consultation.duration_minutes} min
                          </div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: "var(--vendor-primary)" }}
                          >
                            KSh {consultation.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border"
                style={{
                  background:
                    "color-mix(in srgb, var(--vendor-primary) 6%, transparent)",
                  borderColor:
                    "color-mix(in srgb, var(--vendor-primary) 15%, transparent)",
                }}
              >
                <div>
                  <h4
                    className="font-semibold text-lg"
                    style={{ color: "var(--vendor-primary)" }}
                  >
                    Ready to book?
                  </h4>
                  <p className="text-muted-foreground">
                    Choose a consultation type, select your preferred time, and provide health details.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setShowBookingFlow(true)}
                  className="gap-2 shrink-0 text-white"
                  style={{ background: "var(--vendor-primary)" }}
                >
                  Book Consultation
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          ) : (
            <div className="text-center py-20 bg-muted/50 rounded-xl">
              <Stethoscope className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Consultations Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This pharmacy doesn't offer consultation services yet. Check back later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky upload bar */}
      <PharmacyStickyUploadBar vendorId={vendor.id} />

      {/* Consultation Booking Flow Dialog */}
      <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ConsultationBookingFlow
            vendor={{
              id: vendor.id,
              business_name: vendor.business_name,
              business_address: vendor.business_address,
              logo_url: vendor.logo_url,
              rating: vendor.rating,
            }}
            onClose={() => setShowBookingFlow(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

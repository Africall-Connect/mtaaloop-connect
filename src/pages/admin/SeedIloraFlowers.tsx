import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle, Flower2 } from "lucide-react";
import { toast } from "sonner";

import freshFlowersImg from "@/assets/products/fresh-flowers.jpg";
import bouquetsImg from "@/assets/products/bouquets.jpg";
import giftBasketsImg from "@/assets/products/gift-baskets.jpg";
import indoorPlantsImg from "@/assets/products/indoor-plants.jpg";
import cakesPastriesImg from "@/assets/products/cakes-pastries.jpg";
import customArrangementsImg from "@/assets/products/custom-arrangements.jpg";
import eventDecorationsImg from "@/assets/products/event-decorations.jpg";

const SUBCATEGORY_IMAGES: Record<string, string> = {
  "Fresh Flowers": freshFlowersImg,
  "Bouquets": bouquetsImg,
  "Gift Baskets & Hampers": giftBasketsImg,
  "Indoor Plants": indoorPlantsImg,
  "Cake & Pastries": cakesPastriesImg,
  "Custom Arrangements": customArrangementsImg,
  "Event Decorations": eventDecorationsImg,
};

const ALL_PRODUCTS = [
  // Fresh Flowers
  { name: "Red Roses (Single Stem)", subcategory: "Fresh Flowers", price: 150, stock: 50 },
  { name: "White Lilies (Single Stem)", subcategory: "Fresh Flowers", price: 200, stock: 50 },
  { name: "Pink Carnations (Single Stem)", subcategory: "Fresh Flowers", price: 120, stock: 50 },
  { name: "Yellow Sunflowers (Single Stem)", subcategory: "Fresh Flowers", price: 180, stock: 50 },
  { name: "Purple Orchids (Single Stem)", subcategory: "Fresh Flowers", price: 350, stock: 50 },
  { name: "Orange Gerberas (Single Stem)", subcategory: "Fresh Flowers", price: 130, stock: 50 },
  { name: "Mixed Tulips (5 Stems)", subcategory: "Fresh Flowers", price: 600, stock: 50 },
  { name: "White Roses (Single Stem)", subcategory: "Fresh Flowers", price: 160, stock: 50 },
  { name: "Lavender Stems (3 Pack)", subcategory: "Fresh Flowers", price: 450, stock: 50 },
  { name: "Red Anthuriums (Single)", subcategory: "Fresh Flowers", price: 280, stock: 50 },
  { name: "Blue Hydrangeas (Single Head)", subcategory: "Fresh Flowers", price: 400, stock: 50 },
  { name: "Pink Peonies (Single Stem)", subcategory: "Fresh Flowers", price: 500, stock: 50 },
  { name: "Mixed Daisies (10 Stems)", subcategory: "Fresh Flowers", price: 350, stock: 50 },
  { name: "Yellow Chrysanthemums (5 Stems)", subcategory: "Fresh Flowers", price: 300, stock: 50 },
  { name: "Bird of Paradise (Single)", subcategory: "Fresh Flowers", price: 450, stock: 50 },
  { name: "White Jasmine Sprigs (5 Pack)", subcategory: "Fresh Flowers", price: 250, stock: 50 },
  { name: "Red Carnations (Single Stem)", subcategory: "Fresh Flowers", price: 120, stock: 50 },
  { name: "Pink Stargazer Lily (Single)", subcategory: "Fresh Flowers", price: 320, stock: 50 },
  { name: "Mixed Wildflowers (10 Stems)", subcategory: "Fresh Flowers", price: 400, stock: 50 },
  { name: "Protea (Single Stem)", subcategory: "Fresh Flowers", price: 550, stock: 50 },
  // Bouquets
  { name: "Classic Red Rose Bouquet (12)", subcategory: "Bouquets", price: 2500, stock: 50 },
  { name: "Mixed Spring Bouquet", subcategory: "Bouquets", price: 1800, stock: 50 },
  { name: "Luxury White & Pink Bouquet", subcategory: "Bouquets", price: 3500, stock: 50 },
  { name: "Sunshine Yellow Bouquet", subcategory: "Bouquets", price: 2000, stock: 50 },
  { name: "Romantic Pink Rose Bouquet (24)", subcategory: "Bouquets", price: 4500, stock: 50 },
  { name: "Wildflower Meadow Bouquet", subcategory: "Bouquets", price: 1500, stock: 50 },
  { name: "Elegant Orchid & Lily Bouquet", subcategory: "Bouquets", price: 4000, stock: 50 },
  { name: "Birthday Celebration Bouquet", subcategory: "Bouquets", price: 2200, stock: 50 },
  { name: "Pastel Dream Bouquet", subcategory: "Bouquets", price: 2800, stock: 50 },
  { name: "Tropical Paradise Bouquet", subcategory: "Bouquets", price: 3200, stock: 50 },
  { name: "Mini Hand-Tied Bouquet", subcategory: "Bouquets", price: 800, stock: 50 },
  { name: "Grand Red Rose Bouquet (50)", subcategory: "Bouquets", price: 8500, stock: 50 },
  { name: "Sympathy White Bouquet", subcategory: "Bouquets", price: 2500, stock: 50 },
  { name: "Lavender & Rose Bouquet", subcategory: "Bouquets", price: 3000, stock: 50 },
  { name: "Sunflower Delight Bouquet", subcategory: "Bouquets", price: 2200, stock: 50 },
  { name: "Peony & Hydrangea Bouquet", subcategory: "Bouquets", price: 5000, stock: 50 },
  { name: "Budget Friendly Mixed Bouquet", subcategory: "Bouquets", price: 1000, stock: 50 },
  { name: "Mother's Day Special Bouquet", subcategory: "Bouquets", price: 3500, stock: 50 },
  { name: "Valentine's Premium Bouquet", subcategory: "Bouquets", price: 6000, stock: 50 },
  { name: "Dried Flower Bouquet", subcategory: "Bouquets", price: 2800, stock: 50 },
  // Gift Baskets & Hampers
  { name: "Fruit & Chocolate Hamper", subcategory: "Gift Baskets & Hampers", price: 3500, stock: 50 },
  { name: "Wine & Cheese Gift Basket", subcategory: "Gift Baskets & Hampers", price: 5500, stock: 50 },
  { name: "Spa & Wellness Hamper", subcategory: "Gift Baskets & Hampers", price: 4000, stock: 50 },
  { name: "Gourmet Tea Collection Basket", subcategory: "Gift Baskets & Hampers", price: 2800, stock: 50 },
  { name: "Baby Welcome Hamper", subcategory: "Gift Baskets & Hampers", price: 4500, stock: 50 },
  { name: "Corporate Thank You Basket", subcategory: "Gift Baskets & Hampers", price: 6000, stock: 50 },
  { name: "Chocolate Lovers Hamper", subcategory: "Gift Baskets & Hampers", price: 3000, stock: 50 },
  { name: "Fresh Fruit Basket (Premium)", subcategory: "Gift Baskets & Hampers", price: 3500, stock: 50 },
  { name: "Coffee Connoisseur Hamper", subcategory: "Gift Baskets & Hampers", price: 3200, stock: 50 },
  { name: "Get Well Soon Care Package", subcategory: "Gift Baskets & Hampers", price: 2500, stock: 50 },
  { name: "Kenyan Delicacies Hamper", subcategory: "Gift Baskets & Hampers", price: 4000, stock: 50 },
  { name: "Anniversary Luxury Hamper", subcategory: "Gift Baskets & Hampers", price: 7500, stock: 50 },
  { name: "Snack Attack Gift Basket", subcategory: "Gift Baskets & Hampers", price: 2000, stock: 50 },
  { name: "New Home Essentials Hamper", subcategory: "Gift Baskets & Hampers", price: 5000, stock: 50 },
  { name: "Birthday Treats Basket", subcategory: "Gift Baskets & Hampers", price: 2800, stock: 50 },
  { name: "Organic & Healthy Hamper", subcategory: "Gift Baskets & Hampers", price: 3800, stock: 50 },
  { name: "Champagne Celebration Basket", subcategory: "Gift Baskets & Hampers", price: 8000, stock: 50 },
  { name: "Kids Party Hamper", subcategory: "Gift Baskets & Hampers", price: 2200, stock: 50 },
  { name: "Breakfast in Bed Hamper", subcategory: "Gift Baskets & Hampers", price: 3000, stock: 50 },
  { name: "Executive Gift Hamper", subcategory: "Gift Baskets & Hampers", price: 10000, stock: 50 },
  // Indoor Plants
  { name: "Money Plant (Pothos) - Small", subcategory: "Indoor Plants", price: 500, stock: 50 },
  { name: "Snake Plant (Sansevieria) - Medium", subcategory: "Indoor Plants", price: 1200, stock: 50 },
  { name: "Peace Lily - Medium", subcategory: "Indoor Plants", price: 1500, stock: 50 },
  { name: "Aloe Vera - Small", subcategory: "Indoor Plants", price: 400, stock: 50 },
  { name: "Fiddle Leaf Fig - Large", subcategory: "Indoor Plants", price: 3500, stock: 50 },
  { name: "Spider Plant - Hanging", subcategory: "Indoor Plants", price: 800, stock: 50 },
  { name: "ZZ Plant - Medium", subcategory: "Indoor Plants", price: 1800, stock: 50 },
  { name: "Succulent Mix (Set of 3)", subcategory: "Indoor Plants", price: 900, stock: 50 },
  { name: "Rubber Plant - Medium", subcategory: "Indoor Plants", price: 1400, stock: 50 },
  { name: "Boston Fern - Hanging", subcategory: "Indoor Plants", price: 1000, stock: 50 },
  { name: "Jade Plant - Small", subcategory: "Indoor Plants", price: 600, stock: 50 },
  { name: "Monstera Deliciosa - Large", subcategory: "Indoor Plants", price: 4000, stock: 50 },
  { name: "Bamboo Palm - Medium", subcategory: "Indoor Plants", price: 2200, stock: 50 },
  { name: "Cactus Collection (Set of 5)", subcategory: "Indoor Plants", price: 1200, stock: 50 },
  { name: "Chinese Evergreen - Medium", subcategory: "Indoor Plants", price: 1300, stock: 50 },
  { name: "Bonsai Tree - Decorative", subcategory: "Indoor Plants", price: 3000, stock: 50 },
  { name: "English Ivy - Hanging", subcategory: "Indoor Plants", price: 700, stock: 50 },
  { name: "Philodendron - Medium", subcategory: "Indoor Plants", price: 1100, stock: 50 },
  { name: "Lucky Bamboo (5 Stalks)", subcategory: "Indoor Plants", price: 800, stock: 50 },
  { name: "Orchid Plant in Ceramic Pot", subcategory: "Indoor Plants", price: 2500, stock: 50 },
  // Cake & Pastries
  { name: "Chocolate Fudge Cake (1kg)", subcategory: "Cake & Pastries", price: 2500, stock: 50 },
  { name: "Vanilla Birthday Cake (1kg)", subcategory: "Cake & Pastries", price: 2200, stock: 50 },
  { name: "Red Velvet Cake (1kg)", subcategory: "Cake & Pastries", price: 2800, stock: 50 },
  { name: "Carrot Cake (1kg)", subcategory: "Cake & Pastries", price: 2400, stock: 50 },
  { name: "Black Forest Cake (1kg)", subcategory: "Cake & Pastries", price: 2600, stock: 50 },
  { name: "Cheesecake - New York Style", subcategory: "Cake & Pastries", price: 3000, stock: 50 },
  { name: "Cupcakes Assorted (Box of 6)", subcategory: "Cake & Pastries", price: 1200, stock: 50 },
  { name: "Croissants (Box of 4)", subcategory: "Cake & Pastries", price: 800, stock: 50 },
  { name: "Danish Pastries (Box of 4)", subcategory: "Cake & Pastries", price: 900, stock: 50 },
  { name: "Tiramisu Cake (1kg)", subcategory: "Cake & Pastries", price: 3200, stock: 50 },
  { name: "Fruit Tart (Large)", subcategory: "Cake & Pastries", price: 1800, stock: 50 },
  { name: "Chocolate Brownies (Box of 6)", subcategory: "Cake & Pastries", price: 1000, stock: 50 },
  { name: "Cinnamon Rolls (Box of 4)", subcategory: "Cake & Pastries", price: 700, stock: 50 },
  { name: "Lemon Drizzle Cake (1kg)", subcategory: "Cake & Pastries", price: 2300, stock: 50 },
  { name: "Custom Photo Cake (1kg)", subcategory: "Cake & Pastries", price: 3500, stock: 50 },
  { name: "Mini Donuts (Box of 12)", subcategory: "Cake & Pastries", price: 1500, stock: 50 },
  { name: "Wedding Cake Sample Box", subcategory: "Cake & Pastries", price: 2000, stock: 50 },
  { name: "Macarons Assorted (Box of 12)", subcategory: "Cake & Pastries", price: 2400, stock: 50 },
  { name: "Banana Bread Loaf", subcategory: "Cake & Pastries", price: 800, stock: 50 },
  { name: "Chocolate Eclair (Box of 4)", subcategory: "Cake & Pastries", price: 1100, stock: 50 },
  // Custom Arrangements
  { name: "Custom Table Centerpiece", subcategory: "Custom Arrangements", price: 3000, stock: 50 },
  { name: "Personalized Rose Box (Heart)", subcategory: "Custom Arrangements", price: 5000, stock: 50 },
  { name: "Custom Flower Crown", subcategory: "Custom Arrangements", price: 1800, stock: 50 },
  { name: "Bespoke Luxury Vase Arrangement", subcategory: "Custom Arrangements", price: 7000, stock: 50 },
  { name: "Custom Corsage & Boutonniere Set", subcategory: "Custom Arrangements", price: 1500, stock: 50 },
  { name: "Personalized Balloon & Flower Box", subcategory: "Custom Arrangements", price: 3500, stock: 50 },
  { name: "Custom Funeral Wreath", subcategory: "Custom Arrangements", price: 5000, stock: 50 },
  { name: "Personalized Flower Letter (Single)", subcategory: "Custom Arrangements", price: 2500, stock: 50 },
  { name: "Custom Orchid Arrangement", subcategory: "Custom Arrangements", price: 6000, stock: 50 },
  { name: "Bespoke Dried Flower Frame", subcategory: "Custom Arrangements", price: 3000, stock: 50 },
  { name: "Custom Office Desk Arrangement", subcategory: "Custom Arrangements", price: 2000, stock: 50 },
  { name: "Personalized Anniversary Basket", subcategory: "Custom Arrangements", price: 4500, stock: 50 },
  { name: "Custom Baby Shower Arrangement", subcategory: "Custom Arrangements", price: 3500, stock: 50 },
  { name: "Bespoke Church Altar Flowers", subcategory: "Custom Arrangements", price: 8000, stock: 50 },
  { name: "Custom Proposal Setup Flowers", subcategory: "Custom Arrangements", price: 10000, stock: 50 },
  { name: "Personalized Get Well Arrangement", subcategory: "Custom Arrangements", price: 2500, stock: 50 },
  { name: "Custom Graduation Lei", subcategory: "Custom Arrangements", price: 2000, stock: 50 },
  { name: "Bespoke Tropical Arrangement", subcategory: "Custom Arrangements", price: 4000, stock: 50 },
  { name: "Custom Bridal Bouquet Consultation", subcategory: "Custom Arrangements", price: 6000, stock: 50 },
  { name: "Personalized Holiday Wreath", subcategory: "Custom Arrangements", price: 3500, stock: 50 },
  // Event Decorations
  { name: "Wedding Arch Flower Setup", subcategory: "Event Decorations", price: 25000, stock: 50 },
  { name: "Birthday Balloon Garland Kit", subcategory: "Event Decorations", price: 3500, stock: 50 },
  { name: "Conference Table Flowers (Set of 5)", subcategory: "Event Decorations", price: 8000, stock: 50 },
  { name: "Church Wedding Pew Decor (10 pcs)", subcategory: "Event Decorations", price: 15000, stock: 50 },
  { name: "Baby Shower Decoration Package", subcategory: "Event Decorations", price: 12000, stock: 50 },
  { name: "Corporate Event Centerpieces (10)", subcategory: "Event Decorations", price: 20000, stock: 50 },
  { name: "Engagement Party Decor Package", subcategory: "Event Decorations", price: 18000, stock: 50 },
  { name: "Funeral Service Flower Setup", subcategory: "Event Decorations", price: 15000, stock: 50 },
  { name: "Graduation Party Decor Kit", subcategory: "Event Decorations", price: 8000, stock: 50 },
  { name: "Garden Party Flower Stands (5)", subcategory: "Event Decorations", price: 12000, stock: 50 },
  { name: "Wedding Reception Table Decor (20)", subcategory: "Event Decorations", price: 35000, stock: 50 },
  { name: "Anniversary Dinner Decor Setup", subcategory: "Event Decorations", price: 10000, stock: 50 },
  { name: "Valentine's Day Restaurant Decor", subcategory: "Event Decorations", price: 7000, stock: 50 },
  { name: "Ramadan/Eid Decoration Package", subcategory: "Event Decorations", price: 9000, stock: 50 },
  { name: "Christmas Event Decor Setup", subcategory: "Event Decorations", price: 15000, stock: 50 },
  { name: "Harambee/Fundraiser Decor Kit", subcategory: "Event Decorations", price: 6000, stock: 50 },
  { name: "Wedding Car Decoration", subcategory: "Event Decorations", price: 5000, stock: 50 },
  { name: "VIP Lounge Flower Setup", subcategory: "Event Decorations", price: 10000, stock: 50 },
  { name: "Outdoor Event Arch & Draping", subcategory: "Event Decorations", price: 30000, stock: 50 },
  { name: "Kids Party Theme Decor Package", subcategory: "Event Decorations", price: 8000, stock: 50 },
];

export default function SeedIloraFlowers() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addStatus = (msg: string) => setStatus(prev => [...prev, msg]);

  const getImageUrl = (subcategory: string): string => {
    const imgSrc = SUBCATEGORY_IMAGES[subcategory];
    if (!imgSrc) return "";
    // Convert imported asset path to full URL
    return new URL(imgSrc, window.location.origin).href;
  };

  const seedProducts = async () => {
    setLoading(true);
    setStatus([]);
    setProgress(0);

    try {
      addStatus("🔍 Looking up Ilora Flowers vendor...");

      // Find vendor by business name
      const { data: vendors, error: vendorErr } = await supabase
        .from("vendor_profiles")
        .select("id, business_name")
        .ilike("business_name", "%ilora%")
        .limit(1);

      if (vendorErr) throw vendorErr;
      if (!vendors || vendors.length === 0) {
        addStatus("❌ Ilora Flowers vendor not found. Please create the vendor profile first.");
        toast.error("Vendor not found");
        return;
      }

      const vendorId = vendors[0].id;
      addStatus(`✅ Found vendor: ${vendors[0].business_name} (${vendorId})`);

      // Check for existing products
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId);

      if (count && count > 0) {
        addStatus(`⚠️ Vendor already has ${count} products. Deleting existing products first...`);
        const { error: delErr } = await supabase
          .from("products")
          .delete()
          .eq("vendor_id", vendorId);
        if (delErr) throw delErr;
        addStatus("🗑️ Existing products deleted.");
      }

      // Insert products in batches of 20
      const batchSize = 20;
      const totalBatches = Math.ceil(ALL_PRODUCTS.length / batchSize);

      for (let i = 0; i < ALL_PRODUCTS.length; i += batchSize) {
        const batch = ALL_PRODUCTS.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        const records = batch.map(p => ({
          vendor_id: vendorId,
          name: p.name,
          description: `${p.name} - Premium quality from Ilora Flowers`,
          category: "Flowers & Gifts",
          subcategory: p.subcategory,
          price: p.price,
          stock_quantity: p.stock,
          low_stock_threshold: 10,
          is_available: true,
          image_url: getImageUrl(p.subcategory),
        }));

        const { error: insertErr } = await supabase
          .from("products")
          .insert(records);

        if (insertErr) throw insertErr;

        const pct = Math.round((batchNum / totalBatches) * 100);
        setProgress(pct);
        addStatus(`📦 Batch ${batchNum}/${totalBatches} inserted (${batch[0].subcategory})`);
      }

      addStatus(`🎉 Successfully seeded ${ALL_PRODUCTS.length} products for Ilora Flowers!`);
      toast.success(`${ALL_PRODUCTS.length} products added to Ilora Flowers`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      addStatus(`❌ Error: ${msg}`);
      toast.error("Failed to seed products", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flower2 className="h-6 w-6 text-pink-500" />
              Seed Ilora Flowers Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              This will insert all 140 products (7 subcategories × 20 products each) with AI-generated images for Ilora Flowers.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {Object.entries(SUBCATEGORY_IMAGES).map(([name, src]) => (
                <div key={name} className="text-center">
                  <img src={src} alt={name} className="w-full h-20 object-cover rounded-lg" />
                  <p className="text-xs text-muted-foreground mt-1">{name}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={seedProducts}
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding... {progress}%
                </>
              ) : (
                <>
                  <Flower2 className="h-4 w-4 mr-2" />
                  Seed 140 Products
                </>
              )}
            </Button>

            {progress > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {status.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-1">
                {status.map((s, i) => (
                  <p key={i} className="text-sm font-mono flex items-start gap-2">
                    {s.startsWith("❌") ? (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : s.startsWith("🎉") ? (
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : null}
                    <span>{s}</span>
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

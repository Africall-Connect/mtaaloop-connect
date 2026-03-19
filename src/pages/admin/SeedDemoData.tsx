import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SeedDemoData() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const { toast } = useToast();

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, message]);
  };

  const seedDemoData = async () => {
    setLoading(true);
    setStatus([]);
    
    try {
      addStatus("🚀 Starting demo data seeding...");

      // 1. Create demo vendor
      addStatus("📝 Creating demo vendor...");
      const { data: vendor, error: vendorError } = await supabase
        .from('vendor_profiles')
        .insert({
          business_name: "DukaMart Express",
          slug: "dukamart-express",
          business_description: "Your neighborhood supermarket with everything you need",
          operational_category: "inventory",
          tagline: "Fresh produce, groceries & daily essentials",
          rating: 4.5,
          delivery_time: "20-30 mins",
          delivery_fee: 50,
          is_open: true,
          business_phone: "0700000000",
          business_address: "Nairobi",
          business_type: "living-essentials",
        } as any)
        .select()
        .single();

      if (vendorError) {
        addStatus(`❌ Error creating vendor: ${vendorError.message}`);
        throw vendorError;
      }
      addStatus(`✅ Created vendor: ${vendor.business_name}`);

      // 2. Create vendor category
      addStatus("📁 Creating vendor category...");
      const { data: category, error: categoryError } = await supabase
        .from('vendor_categories')
        .insert({
          vendor_id: vendor.id,
          name: "Shopping",
          is_active: true
        })
        .select()
        .single();

      if (categoryError) {
        addStatus(`❌ Error creating category: ${categoryError.message}`);
        throw categoryError;
      }
      addStatus(`✅ Created category: ${category.name}`);

      // 3. Create vendor subcategories
      addStatus("📂 Creating vendor subcategories...");
      const subcategoriesToCreate = [
        { name: "Minimart", displayName: "Minimart" },
        { name: "Fresh Produce", displayName: "Fresh Produce" },
        { name: "Butchery", displayName: "Butchery" }
      ];

      const subcategoryInserts = subcategoriesToCreate.map(sub => ({
        category_id: category.id,
        vendor_id: vendor.id,
        name: sub.name,
        is_active: true
      }));

      const { data: subcategories, error: subcategoryError } = await supabase
        .from('vendor_subcategories')
        .insert(subcategoryInserts)
        .select();

      if (subcategoryError) {
        addStatus(`❌ Error creating subcategories: ${subcategoryError.message}`);
        throw subcategoryError;
      }
      addStatus(`✅ Created ${subcategories?.length} subcategories`);

      // 4. Create demo products
      addStatus("🛒 Creating demo products...");
      const productsToCreate = [
        // Minimart products
        { name: "Fresh Milk 1L", price: 120, category: "Shopping", subcategory: "Minimart" },
        { name: "White Bread", price: 50, category: "Shopping", subcategory: "Minimart" },
        { name: "Rice 2kg", price: 200, category: "Shopping", subcategory: "Minimart" },
        { name: "Cooking Oil 1L", price: 300, category: "Shopping", subcategory: "Minimart" },
        { name: "Sugar 2kg", price: 250, category: "Shopping", subcategory: "Minimart" },
        
        // Fresh Produce
        { name: "Tomatoes 1kg", price: 80, category: "Shopping", subcategory: "Fresh Produce" },
        { name: "Onions 1kg", price: 70, category: "Shopping", subcategory: "Fresh Produce" },
        { name: "Potatoes 2kg", price: 150, category: "Shopping", subcategory: "Fresh Produce" },
        { name: "Spinach Bunch", price: 40, category: "Shopping", subcategory: "Fresh Produce" },
        
        // Butchery
        { name: "Beef 1kg", price: 600, category: "Shopping", subcategory: "Butchery" },
        { name: "Chicken 1kg", price: 400, category: "Shopping", subcategory: "Butchery" },
        { name: "Goat Meat 1kg", price: 800, category: "Shopping", subcategory: "Butchery" }
      ];

      const productInserts = productsToCreate.map(product => ({
        vendor_id: vendor.id,
        name: product.name,
        price: product.price,
        category: product.category,
        subcategory: product.subcategory,
        in_stock: true,
        description: `Fresh ${product.name.toLowerCase()} from ${vendor.business_name}`
      }));

      const { data: products, error: productsError } = await supabase
        .from('products')
        .insert(productInserts)
        .select();

      if (productsError) {
        addStatus(`❌ Error creating products: ${productsError.message}`);
        throw productsError;
      }
      addStatus(`✅ Created ${products?.length} products`);

      addStatus("🎉 Demo data seeding completed successfully!");
      
      toast({
        title: "Success!",
        description: "Demo data has been seeded. Check the Shopping > Minimart category.",
      });

    } catch (error) {
      console.error('Error seeding demo data:', error);
      addStatus(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: "Error",
        description: "Failed to seed demo data. Check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Demo Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a demo vendor "DukaMart Express" with Shopping category,
            3 subcategories (Minimart, Fresh Produce, Butchery), and 12 products.
          </p>
          
          <Button 
            onClick={seedDemoData} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Seed Demo Data
          </Button>

          {status.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Status Log
              </h3>
              <div className="space-y-1 text-sm font-mono">
                {status.map((msg, idx) => (
                  <div key={idx} className={
                    msg.includes('✅') ? 'text-green-600' :
                    msg.includes('❌') ? 'text-red-600' :
                    msg.includes('🎉') ? 'text-blue-600 font-bold' :
                    'text-foreground'
                  }>
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

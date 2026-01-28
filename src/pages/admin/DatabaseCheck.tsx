import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VendorProfile {
  id: string;
  business_name: string;
  operational_category: string;
}

interface VendorCategory {
  id: string;
  vendor_id: string;
  name: string;
  is_active: boolean;
}

interface VendorSubcategory {
  id: string;
  category_id: string;
  vendor_id: string;
  name: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  vendor_id: string;
  category: string;
  subcategory: string | null;
}

export default function DatabaseCheck() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // Check vendors
      const { data: vendorsData } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, operational_category')
        .limit(10);
      
      // Check vendor categories
      const { data: categoriesData } = await supabase
        .from('vendor_categories')
        .select('id, vendor_id, name, is_active')
        .limit(20);
      
      // Check vendor subcategories
      const { data: subcategoriesData } = await supabase
        .from('vendor_subcategories')
        .select('id, category_id, vendor_id, name, is_active')
        .limit(20);
      
      // Check products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, vendor_id, category, subcategory')
        .limit(20);

      setVendors(vendorsData || []);
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
      setProducts(productsData || []);

      console.log('Vendors:', vendorsData);
      console.log('Categories:', categoriesData);
      console.log('Subcategories:', subcategoriesData);
      console.log('Products:', productsData);
    } catch (error) {
      console.error('Error checking database:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Database Check</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({vendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(vendors, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Subcategories ({subcategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(subcategories, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(products, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

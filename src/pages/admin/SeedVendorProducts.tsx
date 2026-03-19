import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Plus, Trash2, Upload, Package, Store, ImageIcon, Sparkles, Check, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { SUBCATEGORY_OPTIONS } from "@/constants/categories";

interface VendorProfile {
  id: string;
  business_name: string;
  business_type: string;
}

interface ProductRow {
  id: string;
  name: string;
  subcategory: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
}

const createEmptyProduct = (): ProductRow => ({
  id: crypto.randomUUID(),
  name: "",
  subcategory: "",
  price: 0,
  stock: 50,
  description: "",
  image_url: "",
});

export default function SeedVendorProducts() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([createEmptyProduct()]);
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [existingCount, setExistingCount] = useState(0);
  const [clearExisting, setClearExisting] = useState(false);

  const addStatus = (msg: string) => setStatus(prev => [...prev, msg]);

  // Fetch all vendors
  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id, business_name, business_type")
        .eq("is_approved", true)
        .order("business_name");

      if (error) {
        toast.error("Failed to load vendors");
        console.error(error);
      } else {
        setVendors(data || []);
      }
      setLoadingVendors(false);
    };
    fetchVendors();
  }, []);

  // When vendor changes, load their subcategories and existing product count
  const onVendorChange = useCallback(async (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const vendor = vendors.find(v => v.id === vendorId) || null;
    setSelectedVendor(vendor);
    setStatus([]);
    setProgress(0);

    if (!vendor) return;

    // Get subcategories from vendor_subcategories table
    const { data: vendorSubs } = await supabase
      .from("vendor_subcategories")
      .select("name")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("display_order");

    // Fallback to constant subcategories if none in DB
    const dbSubs = vendorSubs?.map(s => s.name) || [];
    const constantSubs = SUBCATEGORY_OPTIONS[vendor.business_type] || [];
    setSubcategories(dbSubs.length > 0 ? dbSubs : constantSubs);

    // Check existing products
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    setExistingCount(count || 0);
  }, [vendors]);

  const updateProduct = (id: string, field: keyof ProductRow, value: string | number) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addProduct = () => {
    setProducts(prev => [...prev, createEmptyProduct()]);
  };

  const addBulkProducts = (count: number) => {
    const newProducts = Array.from({ length: count }, () => createEmptyProduct());
    setProducts(prev => [...prev, ...newProducts]);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const duplicateProduct = (product: ProductRow) => {
    const dup = { ...product, id: crypto.randomUUID(), name: `${product.name} (Copy)` };
    setProducts(prev => [...prev, dup]);
  };

  // Auto-fill description if empty
  const autoFillDescription = (id: string, name: string) => {
    const product = products.find(p => p.id === id);
    if (product && !product.description && name) {
      updateProduct(id, "description", `${name} - Premium quality from ${selectedVendor?.business_name || "our store"}`);
    }
  };

  // Generate AI image for a product
  const generateImage = async (productId: string, productName: string) => {
    if (!productName.trim()) {
      toast.error("Enter a product name first");
      return;
    }

    setGeneratingImages(prev => new Set(prev).add(productId));

    try {
      const prompt = `Professional product photo of "${productName}" for an online store. Clean white background, high quality, commercial photography style. No text or watermarks.`;

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        updateProduct(productId, "image_url", data.imageUrl);
        toast.success(`Image generated for ${productName}`);
      } else {
        toast.error("No image returned");
      }
    } catch (err) {
      console.error("Image generation error:", err);
      toast.error("Failed to generate image");
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // Seed all products
  const seedProducts = async () => {
    const validProducts = products.filter(p => p.name.trim() && p.price > 0);

    if (validProducts.length === 0) {
      toast.error("Add at least one product with a name and price");
      return;
    }

    if (!selectedVendorId) {
      toast.error("Select a vendor first");
      return;
    }

    setLoading(true);
    setStatus([]);
    setProgress(0);

    try {
      addStatus(`🏪 Seeding products for ${selectedVendor?.business_name}...`);

      // Optionally clear existing
      if (clearExisting && existingCount > 0) {
        addStatus(`🗑️ Deleting ${existingCount} existing products...`);
        const { error: delErr } = await supabase
          .from("products")
          .delete()
          .eq("vendor_id", selectedVendorId);
        if (delErr) throw delErr;
        addStatus("✅ Existing products deleted.");
      }

      // Batch insert
      const batchSize = 20;
      const totalBatches = Math.ceil(validProducts.length / batchSize);

      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        const records = batch.map(p => ({
          vendor_id: selectedVendorId,
          name: p.name,
          description: p.description || `${p.name} - from ${selectedVendor?.business_name}`,
          category: selectedVendor?.business_type || "General",
          subcategory: p.subcategory || null,
          price: p.price,
          stock_quantity: p.stock,
          low_stock_threshold: 10,
          is_available: true,
          image_url: p.image_url || null,
        }));

        const { error: insertErr } = await supabase.from("products").insert(records);
        if (insertErr) throw insertErr;

        const pct = Math.round((batchNum / totalBatches) * 100);
        setProgress(pct);
        addStatus(`📦 Batch ${batchNum}/${totalBatches} inserted (${batch.length} products)`);
      }

      addStatus(`🎉 Successfully seeded ${validProducts.length} products!`);
      toast.success(`${validProducts.length} products added to ${selectedVendor?.business_name}`);

      // Refresh count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", selectedVendorId);
      setExistingCount(count || 0);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      addStatus(`❌ Error: ${msg}`);
      toast.error("Failed to seed products", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Prefill from subcategory (quick-add templates)
  const quickAddFromSubcategory = (subcategory: string, count: number = 5) => {
    const newProducts = Array.from({ length: count }, (_, i) =>
      ({
        ...createEmptyProduct(),
        subcategory,
        name: "",
        description: "",
      })
    );
    setProducts(prev => [...prev, ...newProducts]);
    toast.success(`Added ${count} rows for "${subcategory}"`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Seed Vendor Products</h1>
            <p className="text-sm text-muted-foreground">
              Add products for any vendor with optional AI-generated images
            </p>
          </div>
        </div>

        {/* Vendor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5" />
              Select Vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingVendors ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading vendors...
              </div>
            ) : (
              <Select value={selectedVendorId} onValueChange={onVendorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.business_name} ({v.business_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedVendor && (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline">{selectedVendor.business_type}</Badge>
                <Badge variant={existingCount > 0 ? "default" : "secondary"}>
                  {existingCount} existing products
                </Badge>
                {existingCount > 0 && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={e => setClearExisting(e.target.checked)}
                      className="rounded"
                    />
                    Clear existing products before seeding
                  </label>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedVendor && (
          <>
            {/* Quick Add by Subcategory */}
            {subcategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Add by Subcategory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map(sub => (
                      <Button
                        key={sub}
                        variant="outline"
                        size="sm"
                        onClick={() => quickAddFromSubcategory(sub)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {sub} (+5)
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Products ({products.filter(p => p.name.trim()).length} / {products.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addProduct}>
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBulkProducts(10)}>
                      <Plus className="h-4 w-4 mr-1" /> +10 Rows
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBulkProducts(20)}>
                      <Plus className="h-4 w-4 mr-1" /> +20 Rows
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.map((product, index) => (
                  <div key={product.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Product #{index + 1}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateProduct(product)}
                          title="Duplicate"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          disabled={products.length === 1}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Name */}
                      <div className="md:col-span-2">
                        <Label className="text-xs">Product Name *</Label>
                        <Input
                          placeholder="e.g. Classic Red Rose Bouquet"
                          value={product.name}
                          onChange={e => updateProduct(product.id, "name", e.target.value)}
                          onBlur={() => autoFillDescription(product.id, product.name)}
                        />
                      </div>

                      {/* Subcategory */}
                      <div>
                        <Label className="text-xs">Subcategory</Label>
                        {subcategories.length > 0 ? (
                          <Select
                            value={product.subcategory}
                            onValueChange={val => updateProduct(product.id, "subcategory", val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategories.map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="e.g. Main Dishes"
                            value={product.subcategory}
                            onChange={e => updateProduct(product.id, "subcategory", e.target.value)}
                          />
                        )}
                      </div>

                      {/* Price */}
                      <div>
                        <Label className="text-xs">Price (KES) *</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={product.price || ""}
                          onChange={e => updateProduct(product.id, "price", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Description */}
                      <div className="md:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Auto-filled on blur, or type custom"
                          value={product.description}
                          onChange={e => updateProduct(product.id, "description", e.target.value)}
                        />
                      </div>

                      {/* Stock */}
                      <div>
                        <Label className="text-xs">Stock</Label>
                        <Input
                          type="number"
                          min={0}
                          value={product.stock}
                          onChange={e => updateProduct(product.id, "stock", Number(e.target.value))}
                        />
                      </div>

                      {/* Image */}
                      <div>
                        <Label className="text-xs">Image URL</Label>
                        <div className="flex gap-1">
                          <Input
                            placeholder="URL or generate"
                            value={product.image_url}
                            onChange={e => updateProduct(product.id, "image_url", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => generateImage(product.id, product.name)}
                            disabled={generatingImages.has(product.id)}
                            title="Generate AI image"
                          >
                            {generatingImages.has(product.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt=""
                            className="mt-1 h-10 w-10 rounded object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seed Button */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Button
                  onClick={seedProducts}
                  disabled={loading || !selectedVendorId}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding... {progress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Seed {products.filter(p => p.name.trim() && p.price > 0).length} Products
                      to {selectedVendor.business_name}
                    </>
                  )}
                </Button>

                {progress > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {status.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto space-y-1">
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
          </>
        )}
      </div>
    </div>
  );
}

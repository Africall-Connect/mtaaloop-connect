import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useVendorCategories } from '@/hooks/useVendorCategories';
import { ProductData, ErrorResponse } from '@/types/common';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  image_url: string | null;
}

interface ProductFormDialogProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  // might be passed from parent, but we prefer to look up vendor_profile
  vendorId?: string;
}

export default function ProductFormDialog({
  product,
  onClose,
  onSuccess,
  vendorId,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    is_available: true,
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [realVendorId, setRealVendorId] = useState<string | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  
  // Load dynamic vendor categories
  const { categories, subcategories, loading: categoriesLoading } = useVendorCategories(realVendorId);

  // 1. load vendor_profile for logged-in user
  useEffect(() => {
    const loadVendor = async () => {
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;
        if (!user) {
          toast.error('Not logged in');
          return;
        }

        const { data: vp, error: vpErr } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_approved', true)
          .maybeSingle();

        if (vpErr) throw vpErr;

        if (vp?.id) {
          setRealVendorId(vp.id);
        } else if (vendorId) {
          // fallback
          setRealVendorId(vendorId);
        } else {
          toast.error('No approved vendor profile found for this account.');
        }
      } catch (err) {
        console.error('Error loading vendor profile:', err);
        toast.error('Failed to load vendor profile');
      } finally {
        setVendorLoading(false);
      }
    };

    loadVendor();
  }, [vendorId]);

  // 2. load product into form if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        subcategory: product.subcategory || '',
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        low_stock_threshold: product.low_stock_threshold.toString(),
        is_available: product.is_available,
        image_url: product.image_url || '',
      });
    }
  }, [product]);

  // derive subcategories for current category from database
  const selectedCategory = categories.find(cat => cat.name === formData.category);
  const currentSubcategories = selectedCategory
    ? subcategories.filter(sub => sub.category_id === selectedCategory.id)
    : [];

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      // reset subcategory if category changes
      subcategory: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!realVendorId) {
        toast.error('Vendor profile not found or not approved. Cannot save product.');
        return;
      }

      const productData: ProductData = {
        vendor_id: realVendorId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
        is_available: formData.is_available,
        image_url: formData.image_url || null,
      };

      // only add subcategory if present
      if (formData.subcategory) {
        productData.subcategory = formData.subcategory;
      }

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        toast.success('Product created successfully');
      }

      onSuccess();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error(err);
      toast.error('Failed to save product', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {vendorLoading && (
            <p className="text-xs text-muted-foreground">Loading vendor profile...</p>
          )}
          {!vendorLoading && !realVendorId && (
            <p className="text-xs text-destructive">
              No approved vendor profile found. Approve vendor first.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Chicken Burger"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                disabled={categoriesLoading}
              >
                <option value="" disabled>
                  {categoriesLoading ? 'Loading categories...' : 'Select category'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-muted-foreground">
                  No categories found. Please set up categories for your vendor first.
                </p>
              )}
            </div>
          </div>

          {/* Subcategory (only show when category has children) */}
          {formData.category && currentSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <select
                id="subcategory"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                disabled={categoriesLoading}
              >
                <option value="">Select subcategory (optional)</option>
                {currentSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe your product..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Alert *</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                required
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Preview"
                className="mt-2 h-32 w-32 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="is_available" className="font-medium">
                Product Available
              </Label>
              <p className="text-sm text-gray-600">Allow customers to order this product</p>
            </div>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading || vendorLoading} className="flex-1">
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

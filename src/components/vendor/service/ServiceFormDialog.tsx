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
import { ServiceData, ErrorResponse } from '@/types/common';

interface ServiceProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

interface ServiceFormDialogProps {
  service: ServiceProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ServiceFormDialog({
  service,
  onClose,
  onSuccess,
}: ServiceFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    is_available: true,
  });
  const [loading, setLoading] = useState(false);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);

  // Load dynamic vendor categories
  const { categories, subcategories, loading: categoriesLoading } = useVendorCategories(vendorProfileId);

  // Load vendor profile
  useEffect(() => {
    const loadVendor = async () => {
      try {
        const id =
          typeof window !== 'undefined'
            ? localStorage.getItem('ml_vendor_profile_id')
            : null;

        if (id) {
          setVendorProfileId(id);
        } else {
          toast.error('Vendor profile not found');
        }
      } catch (err) {
        console.error('Error loading vendor profile:', err);
        toast.error('Failed to load vendor profile');
      } finally {
        setVendorLoading(false);
      }
    };

    loadVendor();
  }, []);

  // Load service into form if editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category,
        subcategory: service.subcategory || '',
        price: service.price.toString(),
        is_available: service.is_available,
      });
    }
  }, [service]);

  // Derive subcategories for current category
  const selectedCategory = categories.find(cat => cat.name === formData.category);
  const currentSubcategories = selectedCategory
    ? subcategories.filter(sub => sub.category_id === selectedCategory.id)
    : [];

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      subcategory: '', // Reset subcategory when category changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!vendorProfileId) {
        toast.error('Vendor profile not found');
        return;
      }

      const serviceData: ServiceData = {
        vendor_id: vendorProfileId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        item_type: 'service',
      };

      if (formData.subcategory) {
        serviceData.subcategory = formData.subcategory;
      }

      if (service) {
        const { error } = await supabase
          .from('products')
          .update(serviceData)
          .eq('id', service.id);

        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        const { error } = await supabase.from('products').insert([serviceData]);
        if (error) throw error;
        toast.success('Service created successfully');
      }

      onSuccess();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error(err);
      toast.error('Failed to save service', {
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
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {vendorLoading && (
            <p className="text-xs text-muted-foreground">Loading vendor profile...</p>
          )}
          {!vendorLoading && !vendorProfileId && (
            <p className="text-xs text-destructive">
              Vendor profile not found.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Home Cleaning"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  No categories found. Please set up categories first.
                </p>
              )}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe your service..."
            />
          </div>

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

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="is_available" className="font-medium">
                Service Available
              </Label>
              <p className="text-sm text-gray-600">Allow customers to request this service</p>
            </div>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading || vendorLoading} className="flex-1">
              {loading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
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

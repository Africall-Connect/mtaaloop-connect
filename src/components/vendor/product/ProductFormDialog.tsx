import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useVendorCategories } from '@/hooks/useVendorCategories';
import { ProductData, ErrorResponse } from '@/types/common';
import { Upload, X, Link, ImageIcon, Camera } from 'lucide-react';

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
  image_storage_path?: string | null;
}

interface ProductFormDialogProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  vendorId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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
  
  // Image upload state
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { categories, subcategories, loading: categoriesLoading } = useVendorCategories(realVendorId);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();

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
      // If product has an existing image, show it
      if (product.image_url) {
        setImagePreview(product.image_url);
        // Determine if it was an upload or URL
        if (product.image_storage_path) {
          setUploadMethod('upload');
        }
      }
    }
  }, [product]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const selectedCategory = categories.find(cat => cat.name === formData.category);
  const currentSubcategories = selectedCategory
    ? subcategories.filter(sub => sub.category_id === selectedCategory.id)
    : [];

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      subcategory: '',
    }));
  };

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', { description: 'Maximum file size is 5MB' });
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', { description: 'Allowed: JPG, PNG, GIF, WebP' });
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;
    
    // Clean up previous blob URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const uploadImageToStorage = async (file: File, vendorId: string): Promise<{ url: string; path: string }> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${vendorId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  };

  const deleteOldImage = async (storagePath: string) => {
    try {
      await supabase.storage.from('product-images').remove([storagePath]);
    } catch (err) {
      console.warn('Failed to delete old image:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!realVendorId) {
        toast.error('Vendor profile not found or not approved. Cannot save product.');
        return;
      }

      let finalImageUrl = formData.image_url || null;
      let finalStoragePath: string | null = null;

      // Handle image upload
      if (uploadMethod === 'upload' && imageFile) {
        setUploading(true);
        
        // Delete old image if editing and had a previous upload
        if (product?.image_storage_path) {
          await deleteOldImage(product.image_storage_path);
        }

        const { url, path } = await uploadImageToStorage(imageFile, realVendorId);
        finalImageUrl = url;
        finalStoragePath = path;
        setUploading(false);
      } else if (uploadMethod === 'url') {
        // Using URL method - clear any previous storage path
        finalImageUrl = formData.image_url || null;
        
        // If switching from upload to URL, delete old uploaded image
        if (product?.image_storage_path) {
          await deleteOldImage(product.image_storage_path);
        }
      } else if (uploadMethod === 'upload' && !imageFile && product?.image_storage_path) {
        // Keeping existing uploaded image
        finalImageUrl = product.image_url;
        finalStoragePath = product.image_storage_path;
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
        image_url: finalImageUrl,
        image_storage_path: finalStoragePath,
      };

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
        const { error } = await supabase.from('products').insert([productData as any]);
        if (error) throw error;
        toast.success('Product created successfully');
      }

      onSuccess();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error(err);
      toast.error('Failed to save product', { description: err.message });
    } finally {
      setLoading(false);
      setUploading(false);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Image Section with Tabs */}
          <div className="space-y-3">
            <Label>Product Image</Label>
            <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'url' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Image URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-3">
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && uploadMethod === 'url' && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {!imagePreview || (imagePreview.startsWith('http') && !imageFile) ? (
                  <div className="space-y-3">
                    {/* Upload zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF, WebP up to 5MB
                      </p>
                    </div>
                    
                    {/* Camera button - primarily for mobile */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Take a Photo
                    </Button>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Upload preview"
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {uploading && (
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_available" className="font-medium">
                Product Available
              </Label>
              <p className="text-sm text-muted-foreground">Allow customers to order this product</p>
            </div>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading || vendorLoading || uploading} className="flex-1">
              {uploading ? 'Uploading...' : loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
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

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Edit, Trash2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ProductFormDialog from '@/components/vendor/product/ProductFormDialog';
import { Product } from '@/types/database';

interface ProductManagementProps {
  vendorId: string;
  onSwitchToCategories?: () => void;
}

export default function ProductManagement({ vendorId, onSwitchToCategories }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [hasCategories, setHasCategories] = useState(false);
  const [checkingCategories, setCheckingCategories] = useState(true);
  const [realVendorId, setRealVendorId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (vId?: string) => {
    try {
      setLoading(true);
      const targetVendorId = vId || realVendorId;
      if (!targetVendorId) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', targetVendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [realVendorId]);

  const loadVendorAndCheckCategories = useCallback(async () => {
    try {
      setCheckingCategories(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRealVendorId(profile.id);
        
        const { data: categories } = await supabase
          .from('vendor_categories')
          .select('id')
          .eq('vendor_id', profile.id)
          .limit(1);

        setHasCategories((categories?.length || 0) > 0);
        
        if ((categories?.length || 0) > 0) {
          fetchProducts(profile.id);
        }
      }
    } catch (error) {
      console.error('Error checking categories:', error);
    } finally {
      setCheckingCategories(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    loadVendorAndCheckCategories();
  }, [vendorId, loadVendorAndCheckCategories]);



  const toggleAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(`Product ${!product.is_available ? 'enabled' : 'disabled'}`);
      fetchProducts();
    } catch (error: unknown) {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error: unknown) {
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleProductSuccess = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  if (checkingCategories || loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!hasCategories) {
    return (
      <Alert className="border-amber-500">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-lg font-semibold">Categories Required</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            Before you can add products, you need to set up your product categories first.
            Categories help organize your products (e.g., "Main Dishes", "Sides", "Beverages").
          </p>
          <Button onClick={onSwitchToCategories} variant="default">
            <ArrowRight className="mr-2 h-4 w-4" />
            Go to Category Management
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {dialogOpen && (
        <ProductFormDialog
          product={editingProduct}
          onClose={() => {
            setDialogOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={handleProductSuccess}
          vendorId={realVendorId || undefined}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-start justify-between">
                <span>{product.name}</span>
                <Badge variant={product.is_available ? 'default' : 'secondary'}>
                  {product.is_available ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">KES {product.price}</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAvailability(product)}
                >
                  {product.is_available ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No products yet. Add your first product to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

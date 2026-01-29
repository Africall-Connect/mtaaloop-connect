import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Filter, Download, BarChart3, PackageSearch,
  TrendingUp, AlertCircle, Eye, Edit, Trash2, Copy, ToggleLeft, ArrowLeft, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import ProductFormDialog from '@/components/vendor/product/ProductFormDialog';
import BulkActionsBar from '@/components/vendor/product/BulkActionsBar';
import ProductAnalytics from '@/components/vendor/product/ProductAnalytics';
import { Product, VendorSubcategory } from '@/types/database';

export default function MinimartManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [checkingSubcategories, setCheckingSubcategories] = useState(true);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);

  const checkSubcategories = useCallback(async () => {
    try {
      setCheckingSubcategories(true);
      const vendorProfileId = localStorage.getItem('ml_vendor_profile_id');
      if (!vendorProfileId) {
        setCheckingSubcategories(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vendor_subcategories')
        .select('*')
        .eq('vendor_id', vendorProfileId);

      if (error) throw error;
      setSubcategories(data || []);
      setHasSubcategories((data?.length || 0) > 0);

      if ((data?.length || 0) === 0) {
        toast.error('Please set up your product subcategories first.');
        setTimeout(() => navigate('/vendor/categories'), 1500);
      }
    } catch (error) {
      console.error('Error checking for subcategories:', error);
      toast.error('Could not verify your vendor setup. Please try again.');
    } finally {
      setCheckingSubcategories(false);
      setLoading(false);
    }
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const vendorProfileId = localStorage.getItem('ml_vendor_profile_id');
      if (!vendorProfileId) {
        setProducts([]);
        return;
      }

      let query = supabase.from('products').select('*').eq('vendor_id', vendorProfileId);
      if (sortBy === 'price_low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_high') query = query.order('price', { ascending: false });
      else if (sortBy === 'stock_low') query = query.order('stock_quantity', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Could not fetch products. Please try again.');
    }
  }, [sortBy]);

  useEffect(() => {
    if (user) {
      checkSubcategories();
    }
  }, [user, checkSubcategories]);

  useEffect(() => {
    if (user && hasSubcategories) {
      fetchProducts();
    }
  }, [user, sortBy, hasSubcategories, fetchProducts]);


  const getProductStats = () => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_available).length;
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    return { totalProducts, activeProducts, lowStockProducts, outOfStock, totalValue };
  };

  const filterProducts = () => {
    let filtered = products;
    if (subcategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.subcategory === subcategoryFilter);
    }
    if (statusFilter === 'active') filtered = filtered.filter(p => p.is_available);
    else if (statusFilter === 'inactive') filtered = filtered.filter(p => !p.is_available);
    else if (statusFilter === 'low_stock') filtered = filtered.filter(p => p.stock_quantity <= p.low_stock_threshold);
    else if (statusFilter === 'out_of_stock') filtered = filtered.filter(p => p.stock_quantity === 0);
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_available: !currentStatus }).eq('id', productId);
      if (error) throw error;
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const duplicateProduct = async (product: Product) => {
    try {
      const { id, created_at, ...productData } = product;
      const { error } = await supabase.from('products').insert([{ ...productData, name: `${product.name} (Copy)`, vendor_id: user?.id }]);
      if (error) throw error;
      toast.success('Product duplicated successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to duplicate product');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setShowFormDialog(true);
  };

  const stats = getProductStats();
  const filteredProducts = filterProducts();

  if (checkingSubcategories || loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!hasSubcategories) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate('/vendor/portal')}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-2xl font-bold text-gray-900">MINIMART MANAGEMENT</h1></div></div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Alert className="border-amber-500 max-w-2xl mx-auto mt-12">
            <Layers className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-lg font-semibold">Setup Required</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>Before you can add products, you need to set up your product subcategories first.</p>
              <p className="text-sm text-muted-foreground">This is a one-time setup that will make managing your products much easier.</p>
              <Button onClick={() => navigate('/vendor/categories')} variant="default"><Layers className="mr-2 h-4 w-4" />Set Up Subcategories</Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate('/vendor/portal')}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-2xl font-bold text-gray-900">MINIMART MANAGEMENT</h1></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setShowAnalytics(true)}><BarChart3 className="h-4 w-4 mr-2" />Analytics</Button><Button onClick={() => setShowFormDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button></div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">
          <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-blue-700">{stats.totalProducts}</div><div className="text-sm text-blue-600 mt-1">Total Products</div></CardContent></Card>
          <Card className="bg-green-50 border-green-200"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-green-700">{stats.activeProducts}</div><div className="text-sm text-green-600 mt-1">Active</div></CardContent></Card>
          <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-amber-700">{stats.lowStockProducts}</div><div className="text-sm text-amber-600 mt-1">Low Stock</div>{stats.lowStockProducts > 0 && (<div className="text-xs text-amber-500 mt-1">Needs attention</div>)}</CardContent></Card>
          <Card className="bg-red-50 border-red-200"><CardContent className="p-4 text-center"><div className="text-3xl font-bold text-red-700">{stats.outOfStock}</div><div className="text-sm text-red-600 mt-1">Out of Stock</div></CardContent></Card>
          <Card className="bg-purple-50 border-purple-200"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-700">KES {stats.totalValue.toLocaleString()}</div><div className="text-sm text-purple-600 mt-1">Inventory Value</div></CardContent></Card>
        </div>
        <Card><CardContent className="p-6 space-y-4"><div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div><Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}><SelectTrigger className="w-48"><SelectValue placeholder="All Subcategories" /></SelectTrigger><SelectContent><SelectItem value="all">All Subcategories</SelectItem>{subcategories.map(sub => (<SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>))}</SelectContent></Select><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Most Recent</SelectItem><SelectItem value="price_low">Price: Low to High</SelectItem><SelectItem value="price_high">Price: High to Low</SelectItem><SelectItem value="stock_low">Stock: Low to High</SelectItem></SelectContent></Select><Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button></div></CardContent></Card>
        {selectedProducts.length > 0 && (<BulkActionsBar selectedCount={selectedProducts.length} onClearSelection={() => setSelectedProducts([])} onBulkAction={(action) => { toast.success(`Bulk action: ${action}`); setSelectedProducts([]); }} />)}
        <Tabs defaultValue="all" onValueChange={setStatusFilter}>
          <TabsList className="w-full justify-start bg-white border"><TabsTrigger value="all">All <Badge variant="secondary" className="ml-2">{products.length}</Badge></TabsTrigger><TabsTrigger value="active">Active <Badge variant="secondary" className="ml-2">{stats.activeProducts}</Badge></TabsTrigger><TabsTrigger value="inactive">Inactive <Badge variant="secondary" className="ml-2">{stats.totalProducts - stats.activeProducts}</Badge></TabsTrigger><TabsTrigger value="low_stock">Low Stock <Badge variant="secondary" className="ml-2">{stats.lowStockProducts}</Badge></TabsTrigger><TabsTrigger value="out_of_stock">Out of Stock <Badge variant="secondary" className="ml-2">{stats.outOfStock}</Badge></TabsTrigger></TabsList>
          <TabsContent value={statusFilter} className="mt-4">
            {filteredProducts.length === 0 ? (<Card><CardContent className="p-12 text-center text-gray-500"><PackageSearch className="h-12 w-12 mx-auto mb-4 text-gray-400" /><p>No products found</p></CardContent></Card>) : (<div className="grid gap-4">{filteredProducts.map(product => (<Card key={product.id} className="hover:shadow-lg transition-shadow"><CardContent className="p-6"><div className="flex items-start gap-4"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={(e) => { if (e.target.checked) { setSelectedProducts([...selectedProducts, product.id]); } else { setSelectedProducts(selectedProducts.filter(id => id !== product.id)); } }} className="mt-1" />{product.image_url && (<img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded" />)}<div className="flex-1"><div className="flex items-start justify-between mb-2"><div><h3 className="text-lg font-semibold">{product.name}</h3><p className="text-sm text-gray-600">{product.description}</p></div><div className="flex gap-2"><Badge variant={product.is_available ? 'default' : 'secondary'}>{product.is_available ? 'Active' : 'Inactive'}</Badge><Badge variant="outline">{product.subcategory}</Badge></div></div><div className="grid grid-cols-4 gap-4 mb-4"><div><p className="text-sm text-gray-600">Price</p><p className="text-lg font-bold">KES {product.price.toLocaleString()}</p></div><div><p className="text-sm text-gray-600">Stock</p><div className="flex items-center gap-2"><p className="text-lg font-bold">{product.stock_quantity}</p>{product.stock_quantity <= product.low_stock_threshold && (<AlertCircle className="h-4 w-4 text-amber-500" />)}</div></div><div><p className="text-sm text-gray-600">Low Stock Alert</p><p className="text-lg font-bold">{product.low_stock_threshold}</p></div><div><p className="text-sm text-gray-600">Inventory Value</p><p className="text-lg font-bold">KES {(product.price * product.stock_quantity).toLocaleString()}</p></div></div><div className="flex gap-2 pt-4 border-t"><Button size="sm" variant="outline" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4 mr-1" />Edit</Button><Button size="sm" variant="outline" onClick={() => toggleProductStatus(product.id, product.is_available)}><ToggleLeft className="h-4 w-4 mr-1" />{product.is_available ? 'Deactivate' : 'Activate'}</Button><Button size="sm" variant="outline" onClick={() => duplicateProduct(product)}><Copy className="h-4 w-4 mr-1" />Duplicate</Button><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />View Details</Button><Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button></div></div></div></CardContent></Card>))}</div>)}
          </TabsContent>
        </Tabs>
      </main>
      {showFormDialog && (<ProductFormDialog product={editingProduct} onClose={() => { setShowFormDialog(false); setEditingProduct(null); }} onSuccess={() => { fetchProducts(); setShowFormDialog(false); setEditingProduct(null); }} vendorId={user?.id || ''} />)}
      {showAnalytics && (<ProductAnalytics onClose={() => setShowAnalytics(false)} vendorId={user?.id || ''} />)}
    </div>
  );
}

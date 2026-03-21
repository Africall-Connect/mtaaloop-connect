import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";

interface SupermarketItem {
  id: string;
  product_name: string;
  markup_price: number | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  in_stock: boolean | null;
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop";

const emptyItem: Omit<SupermarketItem, "id"> = {
  product_name: "",
  markup_price: 0,
  price: 0,
  image_url: "",
  category: "",
  in_stock: true,
};

const MtaaLoopMartAdminView = () => {
  const [items, setItems] = useState<SupermarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupermarketItem | null>(null);
  const [formData, setFormData] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SupermarketItem | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let allData: SupermarketItem[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("big_supermarket_items")
          .select("id, product_name, markup_price, price, image_url, category, in_stock")
          .order("created_at", { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += batchSize;
          if (data.length < batchSize) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setItems(allData);
      const uniqueCats = [...new Set(allData.map((i) => i.category).filter(Boolean) as string[])].sort();
      setCategories(uniqueCats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items
    .filter((item) => !selectedCategory || item.category === selectedCategory)
    .filter((item) => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(emptyItem);
    setDialogOpen(true);
  };

  const openEditDialog = (item: SupermarketItem) => {
    setEditingItem(item);
    setFormData({
      product_name: item.product_name,
      markup_price: item.markup_price,
      price: item.price,
      image_url: item.image_url,
      category: item.category,
      in_stock: item.in_stock ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("big_supermarket_items")
          .update({
            product_name: formData.product_name,
            markup_price: formData.markup_price,
            price: formData.price,
            image_url: formData.image_url || null,
            category: formData.category || null,
            in_stock: formData.in_stock,
          })
          .eq("id", editingItem.id);
        if (error) throw error;
        setItems((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...formData } : i));
        toast.success("Product updated");
      } else {
        const { data, error } = await supabase
          .from("big_supermarket_items")
          .insert({
            product_name: formData.product_name,
            markup_price: formData.markup_price,
            price: formData.price,
            image_url: formData.image_url || null,
            category: formData.category || null,
            in_stock: formData.in_stock,
          })
          .select()
          .single();
        if (error) throw error;
        setItems((prev) => [data, ...prev]);
        if (formData.category && !categories.includes(formData.category)) {
          setCategories((prev) => [...prev, formData.category!].sort());
        }
        toast.success("Product added");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("big_supermarket_items")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success("Product deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header - keep existing purple gradient */}
      <header className="mb-8 text-center px-2 sm:px-4">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 drop-shadow-lg">MtaaLoop Mart Management</h1>
          <p className="text-base sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Manage your product inventory with ease. Click on any product card to edit its details, pricing, and availability.
          </p>
        </div>
      </header>

      {/* Stats + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5" />
          <span className="font-medium">{items.length} products across {categories.length} categories</span>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add New Product
        </Button>
      </div>

      {/* Search + Category Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg text-muted-foreground">Loading products...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">{error}</div>
      ) : filteredItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden bg-card border hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 bg-muted/30 overflow-hidden">
                <img
                  src={item.image_url || PLACEHOLDER_IMG}
                  alt={item.product_name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                />
                {item.in_stock === false && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-3 py-1">Out of Stock</Badge>
                  </div>
                )}
                {item.category && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{item.category}</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-base truncate mb-1">{item.product_name}</h3>
                <p className="text-primary font-bold text-xl mb-3">
                  KSh {(item.markup_price ?? item.price ?? 0).toFixed(0)}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={item.in_stock !== false ? "default" : "destructive"} className="text-xs">
                    {item.in_stock !== false ? "In Stock" : "Out of Stock"}
                  </Badge>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Product Name *</Label>
              <Input value={formData.product_name} onChange={(e) => setFormData((p) => ({ ...p, product_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (KSh)</Label>
                <Input type="number" value={formData.price ?? 0} onChange={(e) => setFormData((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Markup Price (KSh)</Label>
                <Input type="number" value={formData.markup_price ?? 0} onChange={(e) => setFormData((p) => ({ ...p, markup_price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category || ""} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={formData.image_url || ""} onChange={(e) => setFormData((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.in_stock ?? true} onCheckedChange={(v) => setFormData((p) => ({ ...p, in_stock: v }))} />
              <Label>In Stock</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.product_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MtaaLoopMartAdminView;

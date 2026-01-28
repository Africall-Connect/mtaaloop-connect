import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical, Layers, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import { VendorCategory, VendorSubcategory } from '@/types/database';
import { ErrorResponse } from '@/types/common';
import { MAIN_CATEGORIES, SUBCATEGORY_OPTIONS } from '@/constants/categories';

interface CategoryManagementProps {
  vendorId: string;
  operationalCategory?: 'inventory' | 'service' | 'booking' | 'minimart' | null;
}

// Classifications based on operational_category
const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Groceries & Essentials",
  "Liquor Store",
  "Fashion & Clothing",
  "Electronics & Gadgets",
  "Pet Services",
  "Home & Garden",
  "Books & Stationery",
  "Baby & Kids",
  "Flowers & Gifts",
  "Agriculture & Farming"
] as const;

const SERVICE_CATEGORIES = [
  "Home Services",
  "Repairs & Maintenance",
  "Auto Services",
  "Utilities & Services",
  "Security Services",
  "Religious Services",
  "Creative Services",
  "Construction Services",
  "Waste & Recycling",
  "Professional Services",
  "Transport & Logistics"
] as const;

const BOOKING_CATEGORIES = [
  "Health & Wellness",
  "Beauty & Spa",
  "Fitness & Sports",
  "Education & Tutoring",
  "Events & Entertainment",
  "Accommodation",
  "Wedding Services",
  "Special Occasions"
] as const;

const MINIMART_CATEGORIES = [
  "Minimart"
] as const;

export default function CategoryManagement({ vendorId, operationalCategory }: CategoryManagementProps) {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VendorCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<VendorSubcategory | null>(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string | null>(null);
  const [fetchedOperationalCategory, setFetchedOperationalCategory] = useState<'inventory' | 'service' | 'booking' | 'minimart' | null>(null);
  const [vendorBusinessType, setVendorBusinessType] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
  });
  
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');

  const fetchCategoriesAndSubcategories = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error fetching categories and subcategories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  const fetchVendorProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('operational_category, business_type')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      setFetchedOperationalCategory(data?.operational_category || null);
      setVendorBusinessType(data?.business_type || null);
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error fetching vendor profile:', err);
      toast.error('Failed to load vendor profile');
      setLoading(false);
    }
  }, [vendorId, fetchCategoriesAndSubcategories]);

  useEffect(() => {
    if (vendorId) {
      fetchVendorProfile();
    }
  }, [vendorId, fetchVendorProfile]);

  useEffect(() => {
    const addDefaultCategory = async () => {
      if (categories.length === 0 && !loading) {
        let categoryLabel: string | undefined;

        if (fetchedOperationalCategory === 'minimart') {
          categoryLabel = 'Minimart';
        } else if (vendorBusinessType) {
          categoryLabel = MAIN_CATEGORIES.find(c => generateSlug(c.value) === vendorBusinessType)?.label;
        }

        if (categoryLabel) {
          const categoryExists = categories.some(c => c.name === categoryLabel);
          if (!categoryExists) {
            try {
              const slug = generateSlug(categoryLabel);
              const categoryData = {
                vendor_id: vendorId,
                name: categoryLabel,
                slug,
                is_active: true,
                display_order: 1,
              };
              const { error } = await supabase.from('vendor_categories').insert([categoryData]);
              if (error) throw error;
              toast.success(`Default category '${categoryLabel}' added.`);
              fetchCategoriesAndSubcategories();
            } catch (error) {
              const err = error as ErrorResponse;
              toast.error('Failed to add default category.', { description: err.message });
            }
          }
        }
      }
    };
    addDefaultCategory();
  }, [fetchedOperationalCategory, vendorBusinessType, categories, loading, vendorId, fetchCategoriesAndSubcategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const slug = generateSlug(categoryForm.name);
      const displayOrder = editingCategory?.display_order ?? categories.length + 1;

      const categoryData = {
        vendor_id: vendorId,
        name: categoryForm.name,
        slug,
        description: null,
        icon: null,
        display_order: displayOrder,
        is_active: true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('vendor_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('vendor_categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('Category created successfully');
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      toast.error('Failed to save category', {
        description: err.message,
      });
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryForSub) {
      toast.error('Please select a category');
      return;
    }

    try {
      const slug = generateSlug(subcategoryForm.name);
      const categorySubcategories = subcategories.filter(s => s.category_id === selectedCategoryForSub);
      const displayOrder = editingSubcategory?.display_order ?? categorySubcategories.length + 1;

      const subcategoryData = {
        vendor_id: vendorId,
        category_id: selectedCategoryForSub,
        name: subcategoryForm.name,
        slug,
        description: null,
        display_order: displayOrder,
        is_active: true,
      };

      if (editingSubcategory) {
        const { error } = await supabase
          .from('vendor_subcategories')
          .update(subcategoryData)
          .eq('id', editingSubcategory.id);

        if (error) throw error;
        toast.success('Subcategory updated successfully');
      } else {
        const { error } = await supabase
          .from('vendor_subcategories')
          .insert([subcategoryData]);

        if (error) throw error;
        toast.success('Subcategory created successfully');
      }

      setSubcategoryDialogOpen(false);
      resetSubcategoryForm();
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      toast.error('Failed to save subcategory', {
        description: err.message,
      });
    }
  };

  const toggleCategoryStatus = async (category: VendorCategory) => {
    try {
      const { error } = await supabase
        .from('vendor_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to update category:', err);
      toast.error('Failed to update category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all products in this category.')) return;

    try {
      const { error } = await supabase
        .from('vendor_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted');
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to delete category:', err);
      toast.error('Failed to delete category');
    }
  };

  const deleteSubcategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      const { error } = await supabase
        .from('vendor_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Subcategory deleted');
      fetchCategoriesAndSubcategories();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to delete subcategory:', err);
      toast.error('Failed to delete subcategory');
    }
  };

  const openEditCategoryDialog = (category: VendorCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
    });
    setCategoryDialogOpen(true);
  };

  const openEditSubcategoryDialog = (subcategory: VendorSubcategory) => {
    setEditingSubcategory(subcategory);
    setSelectedCategoryForSub(subcategory.category_id);
    setSubcategoryForm({
      name: subcategory.name,
    });
    setSubcategoryDialogOpen(true);
  };

  const openAddSubcategoryDialog = (categoryId: string) => {
    setSelectedCategoryForSub(categoryId);
    const selectedCat = categories.find(c => c.id === categoryId);
    setSelectedParentCategory(selectedCat?.name || '');
    setSubcategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '' });
  };

  const resetSubcategoryForm = () => {
    setEditingSubcategory(null);
    setSelectedCategoryForSub(null);
    setSelectedParentCategory('');
    setSubcategoryForm({ name: '' });
  };
  
  const getAvailableCategories = () => {
    // Use fetchedOperationalCategory from database, fallback to prop
    const opCategory = fetchedOperationalCategory || operationalCategory;
    
    if (opCategory === 'inventory') {
      return INVENTORY_CATEGORIES;
    } else if (opCategory === 'service') {
      return SERVICE_CATEGORIES;
    } else if (opCategory === 'booking') {
      return BOOKING_CATEGORIES;
    } else if (opCategory === 'minimart') {
      return MINIMART_CATEGORIES;
    } else {
      return MAIN_CATEGORIES; // fallback for all categories
    }
  };

  const getSubcategoryOptions = () => {
    if (!selectedParentCategory) return [];
    return SUBCATEGORY_OPTIONS[selectedParentCategory] || [];
  };

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Category Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your product categories before adding products
          </p>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-4">
          {categories.map((category) => {
            const categorySubs = subcategories.filter(s => s.category_id === category.id);
            return (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {category.name}
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddSubcategoryDialog(category.id)}
                      >
                        <FolderTree className="h-4 w-4 mr-1" />
                        Add Subcategory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCategoryDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCategoryStatus(category)}
                      >
                        {category.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {categorySubs.length > 0 && (
                  <CardContent>
                    <p className="text-sm font-medium mb-2">Subcategories:</p>
                    <div className="flex flex-wrap gap-2">
                      {categorySubs.map((sub) => (
                        <Badge
                          key={sub.id}
                          variant="outline"
                          className="flex items-center gap-2 py-1 px-3"
                        >
                          {sub.name}
                          <button
                            onClick={() => openEditSubcategoryDialog(sub)}
                            className="hover:text-primary"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteSubcategory(sub.id)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onOpenChange={(open) => {
        setSubcategoryDialogOpen(open);
        if (!open) resetSubcategoryForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubcategorySubmit} className="space-y-4">
            {!editingSubcategory && (
              <div className="space-y-2">
                <Label htmlFor="sub-category">Parent Category *</Label>
                <select
                  id="sub-category"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCategoryForSub || ''}
                  onChange={(e) => {
                    setSelectedCategoryForSub(e.target.value);
                    const selectedCat = categories.find(c => c.id === e.target.value);
                    setSelectedParentCategory(selectedCat?.name || '');
                    setSubcategoryForm({ name: '' });
                  }}
                  required
                >
                  <option value="">Select parent category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedCategoryForSub && (
              <div className="space-y-2">
                <Label htmlFor="sub-name">Subcategory *</Label>
                <select
                  id="sub-name"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ name: e.target.value })}
                  required
                >
                  <option value="">Select subcategory</option>
                  {getSubcategoryOptions().map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Select from common subcategory options
                </p>
              </div>
            )}
            <Button type="submit" className="w-full">
              {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

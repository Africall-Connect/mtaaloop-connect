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
  operationalCategory?: 'inventory' | 'service' | 'booking' | 'pharmacy' | null;
}

// Classifications based on operational_category (new streamlined structure)
const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",
  "Flowers & Gifts",
] as const;

const SERVICE_CATEGORIES = [
  "Utilities & Services",
  "Home Services",
] as const;

const BOOKING_CATEGORIES = [
  "Beauty & Spa",
  "Accommodation",
] as const;

const PHARMACY_CATEGORIES = [
  "Pharmacy",
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
  const [fetchedOperationalCategory, setFetchedOperationalCategory] = useState<'inventory' | 'service' | 'booking' | 'pharmacy' | null>(null);
  const [vendorBusinessType, setVendorBusinessType] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
  });
  
  // For custom subcategory input (Restaurant category)
  const [customSubcategoryName, setCustomSubcategoryName] = useState('');
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

      setFetchedOperationalCategory((data?.operational_category as any) || null);
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

        if (vendorBusinessType) {
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
  }, [vendorBusinessType, categories, loading, vendorId, fetchCategoriesAndSubcategories]);

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

    // Use custom name for Restaurant, otherwise use selected from dropdown
    const subcategoryName = isRestaurantCategory() ? customSubcategoryName : subcategoryForm.name;
    
    if (!subcategoryName.trim()) {
      toast.error('Please enter a subcategory name');
      return;
    }

    try {
      const slug = generateSlug(subcategoryName);
      const categorySubcategories = subcategories.filter(s => s.category_id === selectedCategoryForSub);
      const displayOrder = editingSubcategory?.display_order ?? categorySubcategories.length + 1;

      const subcategoryData = {
        vendor_id: vendorId,
        category_id: selectedCategoryForSub,
        name: subcategoryName,
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
    const parentCat = categories.find(c => c.id === subcategory.category_id);
    setSelectedParentCategory(parentCat?.name || '');
    setSubcategoryForm({
      name: subcategory.name,
    });
    setCustomSubcategoryName(subcategory.name);
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
    setCustomSubcategoryName('');
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
    } else if (opCategory === 'pharmacy') {
      return PHARMACY_CATEGORIES;
    } else {
      // Fallback: show all main categories
      return MAIN_CATEGORIES.map(c => c.value);
    }
  };

  const getSubcategoryOptions = () => {
    if (!selectedParentCategory) return [];
    return SUBCATEGORY_OPTIONS[selectedParentCategory] || [];
  };
  
  // Check if Restaurant category (allows custom subcategories)
  const isRestaurantCategory = () => {
    return selectedParentCategory === 'Restaurant';
  };

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
            Category Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Set up your product categories before adding products
          </p>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {categories.map((category) => {
            const categorySubs = subcategories.filter(s => s.category_id === category.id);
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-2">
                          <span className="truncate">{category.name}</span>
                          <Badge variant={category.is_active ? 'default' : 'secondary'} className="shrink-0">
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                      </div>
                    </div>
                    {/* Mobile: 2-column grid, Desktop: flex row */}
                    <div className="grid grid-cols-2 sm:flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddSubcategoryDialog(category.id)}
                        className="text-xs sm:text-sm"
                      >
                        <FolderTree className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Add </span>Subcategory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCategoryDialog(category)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="ml-1 sm:hidden">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCategoryStatus(category)}
                        className="text-xs sm:text-sm"
                      >
                        {category.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="ml-1 sm:hidden">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {categorySubs.length > 0 && (
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <p className="text-xs sm:text-sm font-medium mb-2">Subcategories:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {categorySubs.map((sub) => (
                        <Badge
                          key={sub.id}
                          variant="outline"
                          className="flex items-center gap-1.5 sm:gap-2 py-1 px-2 sm:px-3 text-xs sm:text-sm"
                        >
                          <span className="truncate max-w-[100px] sm:max-w-none">{sub.name}</span>
                          <button
                            onClick={() => openEditSubcategoryDialog(sub)}
                            className="hover:text-primary shrink-0"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteSubcategory(sub.id)}
                            className="hover:text-destructive shrink-0"
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
                    setCustomSubcategoryName('');
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
                
                {/* Restaurant category: show text input for custom subcategories */}
                {isRestaurantCategory() ? (
                  <>
                    <Input
                      id="sub-name-custom"
                      placeholder="Enter your subcategory name (e.g., Starters, Mains, Desserts)"
                      value={customSubcategoryName}
                      onChange={(e) => setCustomSubcategoryName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Restaurant vendors can create custom subcategories for their menu
                    </p>
                  </>
                ) : getSubcategoryOptions().length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Input
                      id="sub-name-custom"
                      placeholder="Enter subcategory name"
                      value={customSubcategoryName}
                      onChange={(e) => setCustomSubcategoryName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      No predefined subcategories - enter your own
                    </p>
                  </>
                )}
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

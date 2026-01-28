import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorCategory, VendorSubcategory } from '@/types/database';
import { toast } from 'sonner';

interface UseVendorCategoriesReturn {
  categories: VendorCategory[];
  subcategories: VendorSubcategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useVendorCategories = (vendorId: string | null): UseVendorCategoriesReturn => {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;

      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (err: unknown) {
      console.error('Error fetching vendor categories:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    subcategories,
    loading,
    error,
    refetch: fetchCategories,
  };
};

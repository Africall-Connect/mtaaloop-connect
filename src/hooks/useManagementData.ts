import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Types
export interface ProductService {
  id: string;
  business_type_id: string;
  category_id: string;
  name: string;
  description?: string;
  item_type: 'product' | 'service' | 'package';
  base_price: number;
  sale_price?: number;
  unit: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory: boolean;
  duration_minutes?: number;
  requires_booking: boolean;
  max_capacity?: number;
  images: string[];
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  availability_status: 'available' | 'out_of_stock' | 'discontinued';
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: {
    id: string;
    name: string;
  };
  attributes?: Array<{
    attribute_name: string;
    attribute_value: string;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    variant_type: string;
    price_modifier: number;
    stock_quantity?: number;
    sku?: string;
    is_active: boolean;
  }>;
}

export interface ProductCategory {
  id: string;
  business_type_id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface BusinessType {
  id: string;
  name: string;
  display_name: string;
  business_model: 'product' | 'service' | 'hybrid';
  icon?: string;
  description?: string;
  requires_booking: boolean;
  supports_delivery: boolean;
  supports_inventory: boolean;
  created_at: string;
}

// Hooks for fetching data

export const useBusinessTypes = () => {
  return useQuery({
    queryKey: ['business-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_types')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as BusinessType[];
    }
  });
};

export const useBusinessType = (businessTypeName: string) => {
  return useQuery({
    queryKey: ['business-type', businessTypeName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_types')
        .select('*')
        .eq('name', businessTypeName)
        .single();

      if (error) throw error;
      return data as BusinessType;
    },
    enabled: !!businessTypeName
  });
};

export const useProductCategories = (businessTypeId?: string) => {
  return useQuery({
    queryKey: ['product-categories', businessTypeId],
    queryFn: async () => {
      let query = supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (businessTypeId) {
        query = query.eq('business_type_id', businessTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: !!businessTypeId
  });
};

export const useProductsServices = (businessTypeId?: string, categoryId?: string) => {
  return useQuery({
    queryKey: ['products-services', businessTypeId, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products_services')
        .select(`
          *,
          category:product_categories(id, name),
          attributes:product_attributes(attribute_name, attribute_value),
          variants:product_variants(id, name, variant_type, price_modifier, stock_quantity, sku, is_active)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (businessTypeId) {
        query = query.eq('business_type_id', businessTypeId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductService[];
    },
    enabled: !!businessTypeId
  });
};

export const useProductService = (id: string) => {
  return useQuery({
    queryKey: ['product-service', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_services')
        .select(`
          *,
          category:product_categories(id, name),
          attributes:product_attributes(attribute_name, attribute_value),
          variants:product_variants(id, name, variant_type, price_modifier, stock_quantity, sku, is_active)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProductService;
    },
    enabled: !!id
  });
};

// Mutations for managing data

export const useCreateProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<ProductService, 'id' | 'created_at' | 'updated_at' | 'total_orders' | 'total_revenue' | 'average_rating' | 'review_count'>) => {
      const { data, error } = await supabase
        .from('products_services')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-services'] });
      toast.success('Product/Service added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add product/service: ' + error.message);
    }
  });
};

export const useUpdateProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductService> }) => {
      const { data, error } = await supabase
        .from('products_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-services'] });
      queryClient.invalidateQueries({ queryKey: ['product-service'] });
      toast.success('Product/Service updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update product/service: ' + error.message);
    }
  });
};

export const useDeleteProductService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-services'] });
      toast.success('Product/Service deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete product/service: ' + error.message);
    }
  });
};

export const useCreateProductCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<ProductCategory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add category: ' + error.message);
    }
  });
};

// Utility functions

export const getBusinessTypeDisplayName = (businessTypeName: string): string => {
  const displayNames: Record<string, string> = {
    mart: 'MtaaLoop Grocery Store',
    liquor_store: 'MtaaLoop Liquor Store',
    pharmacy: 'MtaaLoop Pharmacy',
    restaurant: 'MtaaLoop Restaurant',
    butchery: 'MtaaLoop Butchery',
    hardware: 'MtaaLoop Hardware Store',
    electronics: 'MtaaLoop Electronics Store',
    stationery: 'MtaaLoop Stationery Store',
    pet_store: 'MtaaLoop Pet Store',
    gas_station: 'MtaaLoop Gas Station',
    water_station: 'MtaaLoop Water Station',
    baby_shop: 'MtaaLoop Baby Shop',
    boutique: 'MtaaLoop Boutique',
    furniture_store: 'MtaaLoop Furniture Store',
    greengrocery: 'MtaaLoop Greengrocery',
    salon: 'MtaaLoop Beauty Salon',
    barbershop: 'MtaaLoop Barbershop',
    spa: 'MtaaLoop Spa',
    gym: 'MtaaLoop Gym',
    car_wash: 'MtaaLoop Car Wash',
    plumber: 'MtaaLoop Plumbing Services',
    electrician: 'MtaaLoop Electrical Services',
    mechanic: 'MtaaLoop Auto Repair',
    tutor: 'MtaaLoop Tutoring Services',
    daycare: 'MtaaLoop Daycare',
    event_planner: 'MtaaLoop Event Planning',
    cleaning_service: 'MtaaLoop Cleaning Services',
    pest_control: 'MtaaLoop Pest Control',
    locksmith: 'MtaaLoop Locksmith Services',
    courier: 'MtaaLoop Courier Services',
    tailor: 'MtaaLoop Tailoring Services',
    dry_cleaner: 'MtaaLoop Dry Cleaning',
    cybercafe: 'MtaaLoop Cybercafe',
    mobile_money: 'MtaaLoop Mobile Money Agent',
    dental_clinic: 'MtaaLoop Dental Clinic',
    laundry: 'MtaaLoop Laundromat',
    bakery: 'MtaaLoop Bakery',
    caterer: 'MtaaLoop Catering Services',
    florist: 'MtaaLoop Florist',
    optical_shop: 'MtaaLoop Optical Shop'
  };

  return displayNames[businessTypeName] || businessTypeName;
};

export const getBusinessTypeDescription = (businessTypeName: string): string => {
  const descriptions: Record<string, string> = {
    mart: 'Your neighborhood grocery store',
    liquor_store: 'Premium beverages delivery',
    pharmacy: '24/7 medication delivery',
    restaurant: 'Fresh local cuisine',
    butchery: 'Quality meats and poultry',
    hardware: 'Tools and building materials',
    electronics: 'Latest gadgets and devices',
    stationery: 'School and office supplies',
    pet_store: 'Everything for your pets',
    gas_station: 'Fuel and convenience store',
    water_station: 'Pure drinking water',
    baby_shop: 'Everything for babies',
    boutique: 'Fashion and accessories',
    furniture_store: 'Home and office furniture',
    greengrocery: 'Fresh fruits and vegetables',
    salon: 'Beauty and hair services',
    barbershop: 'Professional grooming',
    spa: 'Relaxation and wellness',
    gym: 'Fitness and training',
    car_wash: 'Vehicle cleaning services',
    plumber: 'Plumbing services',
    electrician: 'Electrical services',
    mechanic: 'Auto repair services',
    tutor: 'Educational services',
    daycare: 'Childcare services',
    event_planner: 'Event planning services',
    cleaning_service: 'Cleaning services',
    pest_control: 'Pest control services',
    locksmith: 'Locksmith services',
    courier: 'Courier services',
    tailor: 'Tailoring services',
    dry_cleaner: 'Dry cleaning services',
    cybercafe: 'Internet and computer services',
    mobile_money: 'Mobile money services',
    dental_clinic: 'Dental care services',
    laundry: 'Laundry services',
    bakery: 'Fresh baked goods',
    caterer: 'Catering services',
    florist: 'Flowers and arrangements',
    optical_shop: 'Eyewear and vision care'
  };

  return descriptions[businessTypeName] || '';
};

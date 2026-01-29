import { 
  Trash2, Package, Sparkles, Home, Shirt, ChefHat, 
  Footprints, Truck, Coins, Store, ShoppingCart, ShoppingBag,
  type LucideIcon
} from 'lucide-react';

// Maps service slugs to Lucide icons
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  'trash-collection': Trash2,
  'package-collection': Package,
  'osha-viombo': Sparkles,
  'quick-cleaning': Home,
  'laundry-sorting': Shirt,
  'quick-meal-prep': ChefHat,
  'errands': Footprints,
  'delivery': Truck,
  'cashback': Coins,
};

// Category icons for QuickServices tabs
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'delivery': Package,
  'cleaning': Sparkles,
  'cooking': ChefHat,
  'errands': Footprints,
};

export function getServiceIcon(slug: string): LucideIcon {
  return SERVICE_ICONS[slug] || Package;
}

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] || Package;
}

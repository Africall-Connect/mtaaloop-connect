export const PLACEHOLDER_IMAGES = {
  vendor: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400&h=300&fit=crop',
  store: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  service: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
  delivery: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
  cooking: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop',
  trash: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop',
  errands: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
  cart: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop',
  profile: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  liquor: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop',
  flowers: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
  electronics: 'https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=400&h=400&fit=crop',
} as const;

export type PlaceholderImageType = keyof typeof PLACEHOLDER_IMAGES;

export function getPlaceholderImage(type: PlaceholderImageType): string {
  return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.vendor;
}

/**
 * Pick an on-topic fallback image from a free-form category string.
 * Used by `<img onError>` handlers so a broken/random URL never reaches the user.
 */
export function pickFallbackByCategory(category?: string | null): string {
  const c = (category || '').toLowerCase();
  if (/(liquor|wine|beer|spirit|alcohol)/.test(c)) return PLACEHOLDER_IMAGES.liquor;
  if (/(flower|gift|bouquet)/.test(c)) return PLACEHOLDER_IMAGES.flowers;
  if (/(meat|butcher|chicken|beef|pork|goat)/.test(c)) return PLACEHOLDER_IMAGES.meat;
  if (/(mobile|phone|electronic|accessor)/.test(c)) return PLACEHOLDER_IMAGES.electronics;
  if (/(food|drink|restaurant|kitchen)/.test(c)) return PLACEHOLDER_IMAGES.food;
  if (/(clean|laundry)/.test(c)) return PLACEHOLDER_IMAGES.cleaning;
  return PLACEHOLDER_IMAGES.product;
}

/**
 * Image onError handler that swaps a broken/unrelated image (e.g. loremflickr
 * randoms) for a category-appropriate placeholder. Self-disables after one
 * swap to avoid infinite loops.
 */
export function handleProductImageError(category?: string | null) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    img.src = pickFallbackByCategory(category);
  };
}

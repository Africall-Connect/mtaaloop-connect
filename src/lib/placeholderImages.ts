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
} as const;

export type PlaceholderImageType = keyof typeof PLACEHOLDER_IMAGES;

export function getPlaceholderImage(type: PlaceholderImageType): string {
  return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.vendor;
}

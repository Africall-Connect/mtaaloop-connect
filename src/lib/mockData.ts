// Mock data for MTAA Loop Connect marketplace

export type ListingType = 'product' | 'service';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: ListingType;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: ListingType;
  category: string;
  images: string[];
  location: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  isVerified: boolean;
  createdAt: string;
  isFeatured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  role: 'buyer' | 'seller' | 'admin';
  isVerified: boolean;
  paymentLinks: { type: string; url: string }[];
  createdAt: string;
}

export const categories: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: '📱', type: 'product' },
  { id: 'fashion', name: 'Fashion', icon: '👗', type: 'product' },
  { id: 'home', name: 'Home & Garden', icon: '🏠', type: 'product' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', type: 'product' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽', type: 'product' },
  { id: 'books', name: 'Books & Media', icon: '📚', type: 'product' },
  { id: 'repairs', name: 'Repairs', icon: '🔧', type: 'service' },
  { id: 'tutoring', name: 'Tutoring', icon: '📖', type: 'service' },
  { id: 'delivery', name: 'Delivery', icon: '🚚', type: 'service' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', type: 'service' },
  { id: 'beauty', name: 'Beauty & Wellness', icon: '💅', type: 'service' },
  { id: 'events', name: 'Events & Planning', icon: '🎉', type: 'service' },
];

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max - Like New',
    description: 'Barely used iPhone 14 Pro Max, 256GB, Deep Purple. Comes with original box and accessories. Battery health at 98%.',
    price: 85000,
    currency: 'KES',
    type: 'product',
    category: 'electronics',
    images: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500'],
    location: 'Nairobi, Westlands',
    sellerId: 'user1',
    sellerName: 'John Kamau',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    isVerified: true,
    createdAt: '2024-01-15',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Professional Home Cleaning',
    description: 'Deep cleaning services for homes and offices. We bring all equipment and eco-friendly products. Same-day booking available.',
    price: 3500,
    currency: 'KES',
    type: 'service',
    category: 'cleaning',
    images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'],
    location: 'Nairobi, All Areas',
    sellerId: 'user2',
    sellerName: 'CleanPro Services',
    sellerAvatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100',
    isVerified: true,
    createdAt: '2024-01-14',
    isFeatured: true,
  },
  {
    id: '3',
    title: 'Vintage Leather Jacket',
    description: 'Genuine leather jacket, brown, size M. Classic vintage style in excellent condition. Perfect for the rainy season.',
    price: 4500,
    currency: 'KES',
    type: 'product',
    category: 'fashion',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
    location: 'Mombasa, Nyali',
    sellerId: 'user3',
    sellerName: 'Grace Wanjiku',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    isVerified: false,
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    title: 'Math & Physics Tutoring',
    description: 'Experienced tutor offering online and in-person lessons for high school and university students. 10+ years experience.',
    price: 1500,
    currency: 'KES',
    type: 'service',
    category: 'tutoring',
    images: ['https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=500'],
    location: 'Online / Nairobi',
    sellerId: 'user4',
    sellerName: 'Prof. Ochieng',
    sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    isVerified: true,
    createdAt: '2024-01-12',
    isFeatured: true,
  },
  {
    id: '5',
    title: 'Toyota Vitz 2018',
    description: 'Well maintained Toyota Vitz, automatic transmission, 45,000km. Just serviced with new tires. Serious buyers only.',
    price: 850000,
    currency: 'KES',
    type: 'product',
    category: 'vehicles',
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500'],
    location: 'Kisumu',
    sellerId: 'user5',
    sellerName: 'Auto Deals KE',
    sellerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    isVerified: true,
    createdAt: '2024-01-11',
  },
  {
    id: '6',
    title: 'Event DJ & MC Services',
    description: 'Professional DJ and MC for weddings, corporate events, and parties. Full sound system included. Book early!',
    price: 25000,
    currency: 'KES',
    type: 'service',
    category: 'events',
    images: ['https://images.unsplash.com/photo-1571266028243-d220c6a9869c?w=500'],
    location: 'Nairobi & Surroundings',
    sellerId: 'user6',
    sellerName: 'DJ Maxine',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    isVerified: true,
    createdAt: '2024-01-10',
  },
];

export const mockUser: User = {
  id: 'current-user',
  name: 'Demo User',
  email: 'demo@mtaaloop.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  bio: 'Welcome to MTAA Loop Connect!',
  location: 'Nairobi, Kenya',
  role: 'buyer',
  isVerified: false,
  paymentLinks: [],
  createdAt: '2024-01-01',
};

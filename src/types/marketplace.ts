// Marketplace Types for Location-Based Business Platform

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface Business {
  id: string;
  owner_id: string; // References auth.users(id)
  name: string;
  description?: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  location: Location;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional: business hours, images, etc.
  business_hours?: BusinessHours;
  profile_image?: string;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "17:00"
  is_closed: boolean;
}

export interface Product {
  id: string;
  business_id: string; // References businesses(id)
  name: string;
  description?: string;
  price: number;
  currency: string; // "USD", "EUR", etc.
  category: string;
  images?: string[]; // Array of image URLs
  is_available: boolean;
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string; // References auth.users(id)
  avatar_url?: string;
  location?: Location; // User's default location
  is_seller: boolean; // Can create businesses
  created_at: string;
  updated_at: string;
}

// For map display
export interface BusinessMarker {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  product_count?: number;
}

// For search and filtering
export interface BusinessSearchParams {
  category?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  search_term?: string;
}

// API Response types
export interface BusinessWithProducts extends Business {
  products: Product[];
  owner: Pick<UserProfile, 'avatar_url' | 'is_seller'>;
}

export interface CreateBusinessRequest {
  owner_id: string;
  name: string;
  description?: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  location: Location;
}

export interface CreateProductRequest {
  business_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  stock_quantity?: number;
}

// Common categories (you can expand these)
export const BUSINESS_CATEGORIES = [
  'Restaurant',
  'Retail',
  'Services',
  'Healthcare',
  'Automotive',
  'Beauty & Wellness',
  'Technology',
  'Home & Garden',
  'Sports & Recreation',
  'Education',
  'Other'
] as const;

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Health & Beauty',
  'Automotive',
  'Services',
  'Other'
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]; 
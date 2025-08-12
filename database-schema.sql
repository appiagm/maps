-- Marketplace Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  location JSONB, -- Store location as JSON: {latitude, longitude, address, etc.}
  is_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses Table
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  location JSONB NOT NULL, -- {latitude, longitude, address, city, state, etc.}
  business_hours JSONB, -- Store business hours as JSON
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX businesses_owner_id_idx ON businesses(owner_id);
CREATE INDEX businesses_category_idx ON businesses(category);
CREATE INDEX businesses_location_idx ON businesses USING GIN(location);
CREATE INDEX products_business_id_idx ON products(business_id);
CREATE INDEX products_category_idx ON products(category);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Security Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Anyone can view active businesses" ON businesses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can manage their businesses" ON businesses
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create businesses" ON businesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- Products policies
CREATE POLICY "Anyone can view available products" ON products
  FOR SELECT USING (
    is_available = true 
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = products.business_id 
      AND businesses.is_active = true
    )
  );

CREATE POLICY "Business owners can manage their products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = products.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can create products" ON products
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = products.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Functions and Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to search businesses by location
CREATE OR REPLACE FUNCTION search_businesses_by_location(
  search_lat DECIMAL,
  search_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10
)
RETURNS SETOF businesses AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM businesses
  WHERE is_active = true
  AND (
    6371 * acos(
      cos(radians(search_lat)) 
      * cos(radians((location->>'latitude')::decimal)) 
      * cos(radians((location->>'longitude')::decimal) - radians(search_lng)) 
      + sin(radians(search_lat)) 
      * sin(radians((location->>'latitude')::decimal))
    )
  ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(search_lat)) 
      * cos(radians((location->>'latitude')::decimal)) 
      * cos(radians((location->>'longitude')::decimal) - radians(search_lng)) 
      + sin(radians(search_lat)) 
      * sin(radians((location->>'latitude')::decimal))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional - for testing)
-- You can run this after setting up your first user

-- INSERT INTO profiles (id, email, full_name, is_seller) 
-- VALUES (auth.uid(), 'test@example.com', 'Test User', true);

-- INSERT INTO businesses (owner_id, name, description, category, location) 
-- VALUES (
--   auth.uid(), 
--   'Test Coffee Shop', 
--   'Best coffee in town', 
--   'Restaurant',
--   '{"latitude": 40.7128, "longitude": -74.0060, "address": "123 Main St, New York, NY"}'
-- ); 
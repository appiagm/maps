import { supabase } from '../lib/supabase';
import { 
  Business, 
  Product, 
  UserProfile, 
  CreateBusinessRequest, 
  CreateProductRequest,
  BusinessMarker,
  BusinessSearchParams,
  BusinessWithProducts,
  Location
} from '../types/marketplace';

export interface MarketplaceResponse<T = any> {
  data?: T;
  error?: string;
}

class MarketplaceService {
  // ===== USER PROFILE OPERATIONS =====
  
  async createUserProfile(profileData: Partial<UserProfile>): Promise<MarketplaceResponse<UserProfile>> {
    try {
      console.log('Creating/updating user profile:', profileData);
      
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileData.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
        return { error: checkError.message };
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile...');
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profileData.id)
          .select()
          .single();
        
        result = { data, error };
      } else {
        // Create new profile
        console.log('Creating new profile...');
        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Profile operation error:', result.error);
        return { error: result.error.message };
      }

      console.log('Profile operation successful:', result.data);
      return { data: result.data as UserProfile };
    } catch (error) {
      console.error('Profile operation failed:', error);
      return { error: 'Failed to create/update user profile' };
    }
  }

  async getUserProfile(userId: string): Promise<MarketplaceResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as UserProfile };
    } catch (error) {
      return { error: 'Failed to fetch user profile' };
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<MarketplaceResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as UserProfile };
    } catch (error) {
      return { error: 'Failed to update user profile' };
    }
  }

  // ===== BUSINESS OPERATIONS =====

  async createBusiness(businessData: CreateBusinessRequest): Promise<MarketplaceResponse<Business>> {
    console.log('=== MARKETPLACE SERVICE DEBUG ===');
    console.log('Received business data:', JSON.stringify(businessData, null, 2));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Auth user check:', user ? 'User found' : 'No user');
      console.log('User role:', user?.role);
      console.log('User email:', user?.email);
      
      if (!user) {
        console.log('ERROR: User not authenticated');
        return { error: 'User not authenticated' };
      }
      
      // Check if user has authenticated role
      if (user.role !== 'authenticated') {
        console.log('ERROR: User role is not authenticated:', user.role);
        return { error: 'User does not have proper authentication role' };
      }

      console.log('Current user:', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      // First, ensure the user has a profile
      console.log('Checking for user profile with ID:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('Profile error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          console.log('Creating user profile for:', user.id);
          const profileData = {
            id: user.id,
            email: user.email || '',
            is_seller: true,
            avatar_url: 'https://i.pravatar.cc/300'
          };
          
          console.log('Profile data to insert:', profileData);
          
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (createProfileError) {
            console.error('Error creating user profile:', createProfileError);
            return { error: `Failed to create user profile: ${createProfileError.message}` };
          }
          
          console.log('User profile created successfully');
          
          // Verify the profile was created
          const { data: verifyProfile, error: verifyError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
            
          if (verifyError || !verifyProfile) {
            console.error('Profile verification failed:', verifyError);
            return { error: 'Profile was not created successfully' };
          }
          
          console.log('Profile verified:', verifyProfile);
        } else {
          console.error('Unexpected profile error:', profileError);
          return { error: `Failed to check user profile: ${profileError.message}` };
        }
      } else {
        console.log('User profile exists:', profile);
        
        // Check if user is a seller, if not, update them
        if (!profile.is_seller) {
          console.log('User is not a seller, updating profile...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_seller: true })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating user to seller:', updateError);
            return { error: 'Failed to update user permissions' };
          }
          
          console.log('User updated to seller successfully');
        } else {
          console.log('User is already a seller');
        }
      }

      console.log('Creating business with owner_id:', user.id);
      console.log('Business data:', businessData);

      // Log the exact data being inserted
      const insertData = {
        ...businessData,
      };
      console.log('Inserting business data:', JSON.stringify(insertData, null, 2));

      // Validate required fields before insertion
      if (!insertData.name || !insertData.category || !insertData.location) {
        console.error('Missing required fields:', {
          name: !!insertData.name,
          category: !!insertData.category,
          location: !!insertData.location
        });
        return { error: 'Missing required fields for business creation' };
      }

      console.log('About to insert into Supabase...');
      
      // First, let's test if we can even see the Bazar table
      const { data: testData, error: testError } = await supabase
        .from('Bazar')
        .select('id')
        .limit(1);
      
      console.log('Table access test:', {
        canAccess: !testError,
        error: testError ? testError.message : null
      });
      
      // Try the insert without select first to see if it works
      const { error: insertError } = await supabase
        .from('Bazar')
        .insert(insertData);

      console.log('Insert result:', { 
        insertError: insertError ? {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        } : 'No error'
      });

      if (insertError) {
        console.error('Insert error details:', insertError);
        return { error: insertError.message || 'Database insert failed' };
      }

      // If insert succeeded, try to fetch the created business
      console.log('Insert succeeded, fetching created business...');
      const { data, error: fetchError } = await supabase
        .from('Bazar')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Fetch result:', { 
        data: data ? 'Data received' : 'No data', 
        error: fetchError ? 'Error present' : 'No error',
        errorDetails: fetchError ? {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        } : null
      });

      if (fetchError) {
        console.error('Fetch error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        
        // Handle specific error types
        if (fetchError.code === '23505') {
          return { error: 'Business with this name already exists' };
        } else if (fetchError.code === '23503') {
          return { error: 'Foreign key constraint violation - check user profile' };
        } else if (fetchError.code === '23514') {
          return { error: 'Data validation failed - check required fields' };
        }
        
        return { error: fetchError.message || 'Unknown database error' };
      }

      if (!data) {
        console.log('No data returned, but no error either. Checking if business was created...');
        
        // Try to fetch the business we just created
        const { data: fetchedBusiness, error: fetchError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          console.error('Error fetching created business:', fetchError);
          return { error: 'Business may have been created but could not be retrieved' };
        }

        console.log('Fetched created business:', fetchedBusiness);
        return { data: fetchedBusiness as Business };
      }

      console.log('Business created successfully:', data);
      return { data: data as Business };
    } catch (error) {
      console.error('Exception in createBusiness:', error);
      return { error: 'Failed to create business' };
    }
  }

  async getBusinessesByOwner(ownerId: string): Promise<MarketplaceResponse<Business[]>> {
    try {
      const { data, error } = await supabase
        .from('Bazar')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as Business[] };
    } catch (error) {
      return { error: 'Failed to fetch businesses' };
    }
  }

  async getBusiness(businessId: string): Promise<MarketplaceResponse<BusinessWithProducts>> {
    try {
      const { data, error } = await supabase
        .from('Bazar')
        .select(`
          *,
          products (*),
          profiles!Bazar_owner_id_fkey (full_name, phone, email)
        `)
        .eq('id', businessId)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { 
        data: {
          ...data,
          owner: data.profiles,
        } as BusinessWithProducts 
      };
    } catch (error) {
      return { error: 'Failed to fetch business details' };
    }
  }

  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<MarketplaceResponse<Business>> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as Business };
    } catch (error) {
      return { error: 'Failed to update business' };
    }
  }

  async deleteBusiness(businessId: string): Promise<MarketplaceResponse<void>> {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to delete business' };
    }
  }

  // ===== LOCATION-BASED SEARCH =====

  async searchBusinessesByLocation(params: BusinessSearchParams): Promise<MarketplaceResponse<BusinessMarker[]>> {
    try {
      let query = supabase
        .from('businesses')
        .select(`
          id,
          name,
          category,
          location,
          products(id)
        `)
        .eq('is_active', true);

      // Filter by category if provided
      if (params.category) {
        query = query.eq('category', params.category);
      }

      // Search by name if provided
      if (params.search_term) {
        query = query.ilike('name', `%${params.search_term}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      // Ensure data is an array before processing
      if (!data || !Array.isArray(data)) {
        return { data: [] };
      }

      // Transform to BusinessMarker format and filter by location if needed
      let businesses = data.map(business => ({
        id: business.id,
        name: business.name,
        category: business.category,
        latitude: business.location.latitude,
        longitude: business.location.longitude,
        product_count: Array.isArray(business.products) ? business.products.length : 0,
      }));

      // Filter by location radius if provided
      if (params.latitude && params.longitude && params.radius) {
        businesses = businesses.filter(business => {
          const distance = this.calculateDistance(
            params.latitude!,
            params.longitude!,
            business.latitude,
            business.longitude
          );
          return distance <= params.radius!;
        });
      }

      return { data: businesses };
    } catch (error) {
      return { error: 'Failed to search businesses' };
    }
  }

  async getAllBusinessMarkers(): Promise<MarketplaceResponse<BusinessMarker[]>> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          category,
          location,
          products(id)
        `)
        .eq('is_active', true);

      if (error) {
        return { error: error.message };
      }

      // Ensure data is an array before processing
      if (!data || !Array.isArray(data)) {
        return { data: [] };
      }

      const markers = data.map(business => ({
        id: business.id,
        name: business.name,
        category: business.category,
        latitude: business.location.latitude,
        longitude: business.location.longitude,
        product_count: Array.isArray(business.products) ? business.products.length : 0,
      }));

      return { data: markers };
    } catch (error) {
      return { error: 'Failed to fetch business markers' };
    }
  }

  // ===== PRODUCT OPERATIONS =====

  async createProduct(productData: CreateProductRequest): Promise<MarketplaceResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as Product };
    } catch (error) {
      return { error: 'Failed to create product' };
    }
  }

  async getProductsByBusiness(businessId: string): Promise<MarketplaceResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as Product[] };
    } catch (error) {
      return { error: 'Failed to fetch products' };
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<MarketplaceResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as Product };
    } catch (error) {
      return { error: 'Failed to update product' };
    }
  }

  async deleteProduct(productId: string): Promise<MarketplaceResponse<void>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to delete product' };
    }
  }

  // ===== UTILITY FUNCTIONS =====

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula to calculate distance between two points in kilometers
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Convert address to coordinates (you can integrate with Google Geocoding API)
  async geocodeAddress(address: string): Promise<MarketplaceResponse<{ latitude: number; longitude: number }>> {
    // This is a placeholder - you'll integrate with Google Geocoding API
    try {
      // For now, return a sample response
      // In production, use Google Geocoding API
      return { 
        error: 'Geocoding not yet implemented. Please use your address input component to get coordinates.' 
      };
    } catch (error) {
      return { error: 'Geocoding failed' };
    }
  }
}

export const marketplaceService = new MarketplaceService(); 
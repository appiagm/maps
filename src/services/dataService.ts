import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface DatabaseResponse<T = any> {
  data?: T;
  error?: string;
}

export class DataService {
  // Generic method to fetch data from any table
  async fetchData<T>(
    tableName: string,
    columns?: string,
    filters?: Record<string, any>
  ): Promise<DatabaseResponse<T[]>> {
    try {
      let query = supabase.from(tableName).select(columns || '*');

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data: data as T[] };
    } catch (error) {
      return { error: 'An unexpected error occurred while fetching data' };
    }
  }

  // Generic method to insert data
  async insertData<T>(
    tableName: string,
    data: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: insertedData as T };
    } catch (error) {
      return { error: 'An unexpected error occurred while inserting data' };
    }
  }

  // Generic method to update data
  async updateData<T>(
    tableName: string,
    id: string | number,
    updates: Partial<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as T };
    } catch (error) {
      return { error: 'An unexpected error occurred while updating data' };
    }
  }

  // Generic method to delete data
  async deleteData(
    tableName: string,
    id: string | number
  ): Promise<DatabaseResponse<void>> {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred while deleting data' };
    }
  }

  // Example method for uploading files to Supabase Storage
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob
  ): Promise<DatabaseResponse<{ path: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) {
        return { error: error.message };
      }

      return { data: { path: data.path } };
    } catch (error) {
      return { error: 'An unexpected error occurred while uploading file' };
    }
  }

  // Example method to get public URL for a file
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const dataService = new DataService();

export async function fetchBazaars() {
  try {
    const { data, error } = await supabase
      .from('Bazar')
      .select('*')
      .eq('is_active', true); // Only fetch active bazaars

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch bazaars:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

// Fetch bazaars and their owner profiles
export async function fetchBazaarsWithOwners() {
  try {
    // Fetch bazaars
    const { data: bazaars, error: bazaarsError } = await supabase
      .from('Bazar')
      .select('*')
      .eq('is_active', true);
    if (bazaarsError) throw bazaarsError;
    if (!bazaars || bazaars.length === 0) return [];

    // Get unique owner_ids
    const ownerIds = [...new Set(bazaars.map(m => m.owner_id))];
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ownerIds);
    if (profilesError) throw profilesError;

    // Attach owner profile to each bazar
    const bazaarsWithOwners = bazaars.map(bazar => ({
      ...bazar,
      owner: profiles.find(profile => profile.id === bazar.owner_id) || null,
    }));
    return bazaarsWithOwners;
  } catch (error) {
    console.error('Failed to fetch bazaars with owners:', error);
    return [];
  }
} 
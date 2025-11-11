import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.is_admin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to check if user is VIP
export const checkIsVip = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_vip, subscription_end')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    if (!data?.is_vip) return false;
    
    // Check if subscription is still active
    if (data.subscription_end) {
      const now = new Date();
      const subEnd = new Date(data.subscription_end);
      return subEnd > now;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking VIP status:', error);
    return false;
  }
};
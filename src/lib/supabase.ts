import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Ne pas throw d'erreur pour permettre à l'app de démarrer même sans config
// L'erreur sera gérée dans les composants qui utilisent Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables d\'environnement Supabase manquantes. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null as any; // Fallback pour éviter les erreurs de build

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
// Shared Supabase client for CMS to avoid multiple instances
import { getSupabase } from '../../supabaseClient';

// Get the shared instance, with a fallback for when it's not ready yet
const getOrInitSupabase = () => {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('[CMS] Supabase client not available - check if main app is initialized');
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

// Use the same shared instance as the main app
export const cmsSupabase = getOrInitSupabase();

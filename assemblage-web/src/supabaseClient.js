// assemblage-web/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
      console.log('[getSupabase] Shared Supabase client initialized.');
} else {
      console.error('[getSupabase] Supabase URL or Anon Key is missing in .env. Cannot initialize Supabase client.');
      // Optionally throw an error or return a dummy/null client to prevent app crashes if critical
      // For now, it will return null if env vars are missing, leading to CollageService warning.
    }
  }
  return supabaseInstance;
};

// Optional: Export the instance directly if you prefer to call getSupabase() only once at app root
// and then import this instance elsewhere. For simplicity with existing App.jsx, 
// App.jsx will call getSupabase().
// export const supabase = getSupabase();
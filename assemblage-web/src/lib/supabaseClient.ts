import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use the existing global instance from supabaseClient.js if available
let supabaseInstance = null;

if (typeof window !== 'undefined' && window.__supabaseGlobalInstance) {
  // Reuse the instance created by supabaseClient.js
  supabaseInstance = window.__supabaseGlobalInstance;
  console.log('[supabaseClient.ts] Using existing global Supabase instance');
} else if (supabaseUrl && supabaseAnonKey) {
  // This should rarely happen if supabaseClient.js loads first
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  
  if (typeof window !== 'undefined') {
    window.__supabaseGlobalInstance = supabaseInstance;
  }
  
  console.log('[supabaseClient.ts] Created new Supabase instance');
}

export const getSupabase = () => supabaseInstance;
export const supabase = supabaseInstance;

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use the same global instance as other supabase client files
let supabaseInstance = null;

if (typeof window !== 'undefined') {
  if (!window.__supabaseGlobalInstance && supabaseUrl && supabaseAnonKey) {
    // Create if doesn't exist
    window.__supabaseGlobalInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('[lib/supabase.js] Created global Supabase instance');
  }
  supabaseInstance = window.__supabaseGlobalInstance;
}

export const supabase = supabaseInstance

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to check if user is authenticated
export const requireAuth = async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('User must be authenticated')
  }
  return user
}

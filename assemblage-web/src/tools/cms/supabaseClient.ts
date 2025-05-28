// Shared Supabase client for CMS to avoid multiple instances
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a single shared instance
export const cmsSupabase = createClient(supabaseUrl, supabaseAnonKey);

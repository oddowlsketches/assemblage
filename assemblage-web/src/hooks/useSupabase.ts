import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
let supabase: any;

export function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return supabase;
} 
// Use the shared global instance from lib/supabaseClient
import { getSupabase as getGlobalSupabase } from '../lib/supabaseClient';

export function getSupabase() {
  return getGlobalSupabase();
} 
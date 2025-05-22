// assemblage-web/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Retrieve bucket names from environment variables
const PROD_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_PROD || 'images';
const DEV_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET_DEV || 'dev-images';

// Determine the current bucket based on the environment
const APP_ENV = import.meta.env.MODE; // 'development', 'production', etc.
const CURRENT_BUCKET = APP_ENV === 'development' ? DEV_BUCKET : PROD_BUCKET;

let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    if (supabaseUrl && supabaseAnonKey) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
      console.log('[getSupabase] Shared Supabase client initialized.');
    } else {
      console.error('[getSupabase] Supabase URL or Anon Key is missing in .env. Cannot initialize Supabase client.');
    }
  }
  return supabaseInstance;
};

/**
 * Generates an image URL. In development, it points to a local placeholder.
 * In production, it points to the appropriate Supabase storage bucket.
 * @param {string} imagePath - The path to the image file within the Supabase bucket (e.g., "folder/image.jpg") or the full name if in root.
 * @returns {string} The public URL for the image or path to local placeholder.
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '/images/collages/placeholder.png'; // Default placeholder if path is empty

  if (APP_ENV === 'development') {
    // In development, point to a local placeholder. 
    // Assuming your placeholders are in `public/images/collages/` and you want to use one generic one.
    // Or, if you want to try and match, you could do something more complex, but a single placeholder is simplest for now.
    return '/images/collages/placeholder.png'; // Make sure this placeholder exists in your public dir
  } else {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[getImageUrl] Supabase client not available. Returning default placeholder.');
      return '/images/collages/placeholder.png'; 
    }
    const { data } = supabase.storage.from(CURRENT_BUCKET).getPublicUrl(imagePath);
    return data.publicUrl || '/images/collages/placeholder.png'; // Fallback if publicUrl is not generated
  }
}

// console.log(`[SupabaseClient] App Env: ${APP_ENV}, Using Bucket: ${CURRENT_BUCKET}`);

// Optional: Export the instance directly if you prefer to call getSupabase() only once at app root
// and then import this instance elsewhere. For simplicity with existing App.jsx, 
// App.jsx will call getSupabase().
// export const supabase = getSupabase();
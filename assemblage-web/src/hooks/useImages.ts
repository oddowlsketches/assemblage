import useSWR from 'swr';
import { getSupabase } from './useSupabase';

const supa = getSupabase();

// Default collection ID that all users can access
const DEFAULT_COLLECTION_ID = '00000000-0000-0000-0000-000000000001';

const fetcher = async () => {
  // Only fetch images from the default collection for all users
  const { data, error } = await supa
    .from('images')
    .select('*')
    .eq('collection_id', DEFAULT_COLLECTION_ID);
  if (error) throw error;
  return data;
};

export function useImages() {
  const { data, error, isLoading, mutate } = useSWR('images', fetcher, {
    revalidateOnFocus: false,
  });
  return { images: data || [], error, isLoading, mutate };
}

// Export the default collection ID for use in other components
export const getDefaultCollectionId = () => DEFAULT_COLLECTION_ID;

// TODO: export useTemplates, useMasks once tables exist

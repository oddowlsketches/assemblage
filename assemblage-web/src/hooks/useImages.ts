import useSWR from 'swr';
import { getSupabase } from './useSupabase';

const supa = getSupabase();

const fetcher = async () => {
  const { data, error } = await supa.from('images').select('*');
  if (error) throw error;
  return data;
};

export function useImages() {
  const { data, error, isLoading, mutate } = useSWR('images', fetcher, {
    revalidateOnFocus: false,
  });
  return { images: data || [], error, isLoading, mutate };
}

// TODO: export useTemplates, useMasks once tables exist 
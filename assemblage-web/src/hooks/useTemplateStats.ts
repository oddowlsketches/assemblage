import { useState, useEffect } from 'react';
import { getSupabase } from '../supabaseClient';

export function useTemplateStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.rpc('get_template_stats');
        
        if (error) {
          console.error('[useTemplateStats] Error fetching stats:', error);
          setError(error);
          setStats([]);
        } else {
          setStats(data || []);
          console.log('[useTemplateStats] Fetched stats:', data);
        }
      } catch (err) {
        console.error('[useTemplateStats] Error:', err);
        setError(err);
        setStats([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const refetch = async () => {
    return fetchStats();
  };

  return { stats, loading, error, refetch };
}

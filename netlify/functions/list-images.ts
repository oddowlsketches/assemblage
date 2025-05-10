import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async () => {
  const { data, error } = await supa.from('images').select('*');

  return {
    statusCode: error ? 500 : 200,
    body: JSON.stringify({ data, error }),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}; 
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing id param' }) };
  }

  const { data, error } = await supa.from('images').delete().eq('id', id).select().single();

  return {
    statusCode: error ? 500 : 200,
    body: JSON.stringify({ data, error }),
    headers: { 'Content-Type': 'application/json' },
  };
}; 
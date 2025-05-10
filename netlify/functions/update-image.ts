import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { imageSchema } from '../../shared/schema';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing id param' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    // Ensure only valid fields update
    const parseResult = imageSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return { statusCode: 400, body: JSON.stringify({ error: parseResult.error.flatten() }) };
    }

    const { data, error } = await supa.from('images')
      .update(parseResult.data)
      .eq('id', id)
      .select()
      .single();

    return {
      statusCode: error ? 500 : 200,
      body: JSON.stringify({ data, error }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
}; 
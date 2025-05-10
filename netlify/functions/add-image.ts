import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { imageSchema } from '../../shared/schema';

const supa = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    // Validate minimal fields
    const parseResult = imageSchema.partial({
      id: true,
      createdAt: true,
    }).safeParse(body);

    if (!parseResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: parseResult.error.flatten() }),
      };
    }

    const { src, title, tags = [] } = parseResult.data;
    const id = crypto.randomUUID();

    const { data, error } = await supa.from('images').insert({
      id,
      src,
      title,
      tags,
    }).select().single();

    return {
      statusCode: error ? 500 : 200,
      body: JSON.stringify({ data, error }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
}; 
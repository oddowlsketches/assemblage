// Example: How to call the process_image Edge Function

// From a client application
async function processImage(imageId: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/process_image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to process image: ${response.statusText}`);
  }

  return response.json();
}

// Example usage
try {
  const result = await processImage('abc123');
  console.log('Processing complete:', result);
  console.log('Thumbnail URL:', result.thumbnail);
  console.log('Color palette:', result.palette);
} catch (error) {
  console.error('Error processing image:', error);
}

// From another Edge Function (server-side)
async function processImageServerSide(imageId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/process_image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId }),
  });

  return response.json();
}

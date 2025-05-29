import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function should be called by a cron job
    // Check authorization header for cron secret
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('authorization');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all due retry jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('images_retry_queue')
      .select('*')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10); // Process max 10 at a time

    if (fetchError) {
      console.error('Error fetching retry jobs:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch retry jobs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No jobs to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each job
    const results = [];
    for (const job of jobs) {
      try {
        // Call process_image function
        const processUrl = `${supabaseUrl}/functions/v1/process_image`;
        const response = await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageId: job.image_id }),
        });

        const result = await response.json();
        
        // Delete the job from queue (whether successful or not)
        await supabase
          .from('images_retry_queue')
          .delete()
          .eq('id', job.id);

        results.push({
          jobId: job.id,
          imageId: job.image_id,
          status: response.ok ? 'success' : 'failed',
          result,
        });

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        results.push({
          jobId: job.id,
          imageId: job.image_id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Retry queue processed',
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Retry queue error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

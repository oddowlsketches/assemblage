-- Template Analytics Feature - Complete SQL Setup
-- Run this entire script in Supabase SQL Editor

-- Step 1: Create view for popular templates analysis
CREATE OR REPLACE VIEW public.popular_templates_v AS
SELECT 
  template_key,
  COUNT(*) AS save_count,
  MAX(created_at) AS last_saved
FROM saved_collages
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY template_key
ORDER BY save_count DESC;

-- Grant permissions on the view
GRANT SELECT ON public.popular_templates_v TO authenticated;

-- Step 2: Create RPC function to get template stats
CREATE OR REPLACE FUNCTION public.get_template_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'template_key', template_key,
      'save_count', save_count,
      'last_saved', last_saved
    )
  )
  FROM popular_templates_v;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_template_stats() TO authenticated;

-- Verify installation
SELECT 'Template Analytics Setup Complete' AS status;

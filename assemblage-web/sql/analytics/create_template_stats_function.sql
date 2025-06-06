-- Create RPC function to get template stats
create or replace function public.get_template_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_agg(
    jsonb_build_object(
      'template_key', template_key,
      'save_count', save_count,
      'last_saved', last_saved
    )
  )
  from popular_templates_v;
$$;

-- Grant execute permission
grant execute on function public.get_template_stats() to authenticated;

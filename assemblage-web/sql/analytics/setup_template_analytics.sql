-- Combined SQL script for Template Analytics feature

-- Step 1: Create view for popular templates analysis
create or replace view public.popular_templates_v as
select 
  template_key,
  count(*) as save_count,
  max(created_at) as last_saved
from saved_collages
where created_at > now() - interval '30 days'
group by template_key
order by save_count desc;

-- Grant permissions on the view
grant select on public.popular_templates_v to authenticated;

-- Step 2: Create RPC function to get template stats
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

-- Grant execute permission on the function
grant execute on function public.get_template_stats() to authenticated;

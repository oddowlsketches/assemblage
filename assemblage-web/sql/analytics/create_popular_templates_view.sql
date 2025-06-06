-- Create view for popular templates analysis
create or replace view public.popular_templates_v as
select 
  template_key,
  count(*) as save_count,
  max(created_at) as last_saved
from saved_collages
where created_at > now() - interval '30 days'
group by template_key
order by save_count desc;

-- Grant permissions
grant select on public.popular_templates_v to authenticated;

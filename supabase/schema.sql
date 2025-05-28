-- Supabase schema for Assemblage CMS
-- Run via `npm run db:push`

-- Images ----------------------------------------------------
create table if not exists public.images (
  id text primary key,
  src text not null,
  title text not null,
  tags text[] not null default '{}',
  created_at timestamp with time zone not null default now(),
  
  -- Rich metadata fields for better collage generation
  description text,
  is_black_and_white boolean default false,
  is_photograph boolean default true,
  white_edge_score float default 0, -- [0-1] fraction of white pixels at borders
  image_role text default 'narrative' check (image_role in ('texture','narrative','conceptual')),
  palette_suitability text default 'vibrant' check (palette_suitability in ('vibrant','neutral','earthtone','muted','pastel')),
  
  -- Processing metadata
  metadata_status text default 'pending_llm' check (metadata_status in ('pending_llm','processing','complete','error')),
  processing_error text,
  last_processed timestamp with time zone,
  
  -- Collections
  collection_id uuid references public.image_collections(id) on delete set null
);

-- Masks -----------------------------------------------------
create table if not exists public.masks (
  id text primary key,
  key text not null,
  family text not null,
  svg text not null,
  description text,
  tags text[] default '{}',
  created_at timestamp with time zone not null default now()
);

-- Templates -------------------------------------------------
create table if not exists public.templates (
  id text primary key,
  key text not null,
  name text not null,
  family text not null,
  description text,
  params jsonb,
  created_at timestamp with time zone not null default now()
);

-- Collages --------------------------------------------------
create table if not exists public.collages (
  id text primary key,
  template_id text references public.templates(id) on delete set null,
  image_ids text[] not null default '{}',
  param_overrides jsonb,
  created_at timestamp with time zone not null default now()
);

-- Image Collections -----------------------------------------
create table if not exists public.image_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Saved Collages (for authenticated users) -----------------
create table if not exists public.saved_collages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  image_data_url text not null,
  thumbnail_url text,
  template_key text,
  template_params jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
); 
-- Supabase schema for Assemblage CMS
-- Run via `npm run db:push`

-- Images ----------------------------------------------------
create table if not exists public.images (
  id text primary key,
  src text not null,
  title text not null,
  tags text[] not null default '{}',
  created_at timestamp with time zone not null default now()
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
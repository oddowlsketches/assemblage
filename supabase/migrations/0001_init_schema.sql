-- 0001_init_schema.sql
-- Initial migration: create core tables for Assemblage

-- Images ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.images (
  id text PRIMARY KEY,
  src text NOT NULL,
  title text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Masks -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.masks (
  id text PRIMARY KEY,
  key text NOT NULL,
  family text NOT NULL,
  svg text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Templates -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id text PRIMARY KEY,
  key text NOT NULL,
  name text NOT NULL,
  family text NOT NULL,
  description text,
  params jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Collages --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collages (
  id text PRIMARY KEY,
  template_id text REFERENCES public.templates(id) ON DELETE SET NULL,
  image_ids text[] NOT NULL DEFAULT '{}',
  param_overrides jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
); 
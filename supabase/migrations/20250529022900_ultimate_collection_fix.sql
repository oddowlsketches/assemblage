-- 20250529022900_ultimate_collection_fix.sql
-- Ultimate fix: ensure images are available in EVERY possible collection

-- Create the default collection the app is now looking for (simple DELETE/INSERT)
DELETE FROM public.image_collections WHERE id = '00000000-0000-0000-0000-000000000001';
INSERT INTO public.image_collections (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Default Collection');

-- Also ensure all the other collections exist
DELETE FROM public.image_collections WHERE id IN (
    '215c3f9e-70ff-45e5-95e4-413565b38b0f',
    '88844a5d-81b7-4007-a718-09a4ed3e3811',
    '5cd28f2a-8169-4f75-aece-bfb82233f9f8',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
);

INSERT INTO public.image_collections (id, name) VALUES 
  ('215c3f9e-70ff-45e5-95e4-413565b38b0f', 'Main Gallery'),
  ('88844a5d-81b7-4007-a718-09a4ed3e3811', 'Current Gallery'),
  ('5cd28f2a-8169-4f75-aece-bfb82233f9f8', 'Active Gallery'),
  ('00000000-0000-0000-0000-000000000002', 'Architecture'),
  ('00000000-0000-0000-0000-000000000003', 'Nature'),
  ('00000000-0000-0000-0000-000000000004', 'Abstract');

-- Set ALL images to point to the default collection the app is looking for
UPDATE public.images 
SET collection_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Final safety: ensure ALL images are CMS provider with proper defaults
UPDATE public.images 
SET 
    provider = 'cms',
    image_role = COALESCE(image_role, 'narrative')
WHERE provider != 'cms' OR image_role IS NULL; 
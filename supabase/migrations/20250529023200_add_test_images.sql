-- 20250529023200_add_test_images.sql
-- Add test images so the app has data to work with

-- Insert test images into the default collection
INSERT INTO public.images (
    id, 
    src, 
    title, 
    description, 
    tags, 
    image_role, 
    provider, 
    collection_id,
    is_black_and_white,
    created_at
) VALUES 
    (gen_random_uuid(), 'https://picsum.photos/800/600?random=1', 'Abstract Composition 1', 'Abstract geometric forms', ARRAY['abstract', 'geometric'], 'conceptual', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/600/800?random=2', 'Textural Study 1', 'Rich textural elements', ARRAY['texture', 'surface'], 'texture', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/800/800?random=3', 'Narrative Scene 1', 'Storytelling through imagery', ARRAY['narrative', 'scene'], 'narrative', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/700/900?random=4', 'Abstract Form 2', 'Dynamic abstract composition', ARRAY['abstract', 'dynamic'], 'conceptual', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/900/600?random=5', 'Texture Detail 2', 'Close-up textural study', ARRAY['texture', 'detail'], 'texture', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/800/700?random=6', 'Narrative Moment 2', 'Captured narrative moment', ARRAY['narrative', 'moment'], 'narrative', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/600/600?random=7', 'Conceptual Study 3', 'Conceptual art piece', ARRAY['conceptual', 'study'], 'conceptual', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/750/800?random=8', 'Surface Texture 3', 'Interesting surface patterns', ARRAY['texture', 'pattern'], 'texture', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/850/650?random=9', 'Story Fragment 3', 'Fragment of larger narrative', ARRAY['narrative', 'fragment'], 'narrative', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/650/750?random=10', 'Abstract Expression 4', 'Expressive abstract work', ARRAY['abstract', 'expression'], 'conceptual', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/800/800?random=11', 'Material Study 4', 'Study of materials and textures', ARRAY['texture', 'material'], 'texture', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/700/800?random=12', 'Visual Narrative 4', 'Visual storytelling element', ARRAY['narrative', 'visual'], 'narrative', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/800/600?random=13', 'Form Study 5', 'Study of form and space', ARRAY['conceptual', 'form'], 'conceptual', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/600/700?random=14', 'Texture Analysis 5', 'Detailed texture analysis', ARRAY['texture', 'analysis'], 'texture', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()),
    (gen_random_uuid(), 'https://picsum.photos/750/600?random=15', 'Narrative Element 5', 'Key narrative element', ARRAY['narrative', 'element'], 'narrative', 'cms', '00000000-0000-0000-0000-000000000001'::uuid, false, now()); 
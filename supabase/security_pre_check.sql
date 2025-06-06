-- Pre-check script to verify current state before applying security fixes
-- Run this to see what functions and views need to be fixed

-- Check for the SECURITY DEFINER view
SELECT 
    'VIEW' as object_type,
    n.nspname as schema_name,
    c.relname as object_name,
    CASE 
        WHEN c.relkind = 'v' AND c.relrowsecurity THEN 'SECURITY DEFINER'
        ELSE 'NORMAL'
    END as security_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'popular_templates_v'
AND n.nspname = 'public';

-- Check functions with search_path issues
SELECT 
    'FUNCTION' as object_type,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NULL OR NOT 'search_path' = ANY(
            SELECT split_part(unnest(p.proconfig), '=', 1)
        ) THEN 'MUTABLE (INSECURE)'
        ELSE 'SET (SECURE)'
    END as search_path_status,
    p.proconfig as current_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'count_collages_to_migrate',
    'list_pending_images',
    'trigger_generate_metadata',
    'prepare_collages_for_migration',
    'handle_new_user',
    'check_user_storage_limit',
    'get_user_storage_stats',
    'handle_updated_at',
    'update_collection_slug',
    'list_images'
)
ORDER BY p.proname;

-- Check extensions in public schema
SELECT 
    'EXTENSION' as object_type,
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE n.nspname = 'public'
AND e.extname IN ('pg_net', 'vector');

-- Check if any columns use the vector type (important for migration)
SELECT 
    'VECTOR COLUMN' as object_type,
    n.nspname as schema_name,
    c.relname as table_name,
    a.attname as column_name,
    t.typname as data_type
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_type t ON t.oid = a.atttypid
WHERE t.typname = 'vector'
AND n.nspname = 'public'
AND a.attnum > 0
AND NOT a.attisdropped;

-- Summary
SELECT 
    '=== SECURITY CHECK SUMMARY ===' as info
UNION ALL
SELECT 
    'Run this query to see what needs to be fixed before applying migrations.' as info
UNION ALL
SELECT 
    'After reviewing the results, apply the security migration.' as info;

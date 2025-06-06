# Security Fixes for Assemblage Database

## Overview
This document describes the security issues found by Supabase's database linter and the fixes applied.

## Issues Found and Fixed

### 1. **ERROR: Security Definer View** ❌
- **Issue**: The view `public.popular_templates_v` was defined with `SECURITY DEFINER`, which bypasses Row Level Security (RLS) and runs with the permissions of the view creator.
- **Risk**: High - Could expose data that should be protected by RLS
- **Fix**: Recreated the view without `SECURITY DEFINER` property

### 2. **WARNINGS: Function Search Path Mutable** ⚠️
- **Issue**: 10 functions had mutable search paths, making them vulnerable to search path injection attacks
- **Risk**: Medium - Could allow malicious users to hijack function calls
- **Affected Functions**:
  - `count_collages_to_migrate`
  - `list_pending_images`
  - `trigger_generate_metadata`
  - `prepare_collages_for_migration`
  - `handle_new_user`
  - `check_user_storage_limit`
  - `get_user_storage_stats`
  - `handle_updated_at`
  - `update_collection_slug`
  - `list_images`
- **Fix**: Set `search_path = pg_catalog, public` for all functions

### 3. **WARNINGS: Extensions in Public Schema** ⚠️
- **Issue**: Extensions `pg_net` and `vector` were installed in the public schema
- **Risk**: Low-Medium - Clutters public schema and potential naming conflicts
- **Fix**: Created `extensions` schema and moved extensions there
- **Note**: If `vector` extension is in use by existing columns, manual migration may be needed

### 4. **WARNING: Leaked Password Protection Disabled** ⚠️
- **Issue**: Supabase Auth's leaked password protection is not enabled
- **Risk**: Medium - Users could use compromised passwords
- **Fix**: This must be enabled in the Supabase Dashboard (not via SQL)

## How to Apply the Fixes

### Step 1: Backup Your Database
Before applying any fixes, create a backup:
```bash
# Using Supabase CLI
supabase db dump -f backup_before_security_fixes.sql

# Or use pg_dump directly
pg_dump your_database_url > backup_before_security_fixes.sql
```

### Step 2: Apply the Security Migration
```bash
# Push the migration to your database
supabase db push

# Or apply directly
psql your_database_url -f supabase/migrations/20250606000000_fix_security_issues.sql
```

### Step 3: Enable Leaked Password Protection
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Under "Password Settings", enable "Leaked Password Protection"
4. Save the changes

### Step 4: Update Application Code (if needed)

If your application references `pg_net` or `vector` extensions directly, update the references:

```sql
-- Old way
SELECT pg_net.http_get(...);

-- New way
SELECT extensions.pg_net.http_get(...);

-- Or set search path in your connection
SET search_path TO public, extensions;
```

### Step 5: Test Your Application
1. Test all authentication flows
2. Test any features that use the affected functions
3. Test any features that use pg_net or vector extensions
4. Monitor for any errors in your application logs

## Rollback Plan

If issues occur after applying the fixes:

1. **Quick Rollback** (not recommended, reopens vulnerabilities):
   ```bash
   psql your_database_url -f supabase/migrations/20250606000000_rollback_security_fixes.sql.rollback
   ```

2. **Better Approach**: Fix the specific issue:
   - If a function fails, check if it needs schema-qualified table names
   - If extension calls fail, update your code to include the schema
   - If the view doesn't work, check its permissions

## Post-Migration Checklist

- [ ] All functions still work correctly
- [ ] Authentication flows work as expected
- [ ] pg_net HTTP calls work (if used)
- [ ] Vector operations work (if used)
- [ ] No errors in application logs
- [ ] Leaked password protection enabled in dashboard
- [ ] Re-run Supabase linter to confirm fixes

## Need Help?

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Review function definitions to ensure they work with the new search_path
3. Update application code to reference extensions with schema prefix
4. Contact Supabase support if needed

## Security Best Practices Going Forward

1. Always set `search_path` when creating functions:
   ```sql
   CREATE FUNCTION my_function() 
   RETURNS void 
   LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = pg_catalog, public
   AS $$ ... $$;
   ```

2. Install extensions in dedicated schemas:
   ```sql
   CREATE EXTENSION my_extension SCHEMA extensions;
   ```

3. Avoid `SECURITY DEFINER` unless absolutely necessary
4. Regularly run Supabase's database linter to catch new issues
5. Keep leaked password protection enabled

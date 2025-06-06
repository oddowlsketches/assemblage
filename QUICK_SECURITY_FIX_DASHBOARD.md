# Quick Security Fix Guide - Supabase Dashboard Method

Since you're having connection issues with the CLI, here's how to fix the security issues using the Supabase Dashboard:

## Step 1: Create a Backup
1. Go to: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/settings/general
2. Scroll down to "Database Backups"
3. Click "Create a backup"
4. Wait for the backup to complete

## Step 2: Check Current Security Issues
1. Go to: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/sql
2. Click "New query"
3. Copy and paste the contents of this file:
   `/Users/emilyschwartzman/assemblage-app/supabase/security_pre_check.sql`
4. Click "Run" to see current security issues

## Step 3: Apply Security Fixes
1. In the SQL Editor, click "New query"
2. Copy and paste the contents of this file:
   `/Users/emilyschwartzman/assemblage-app/supabase/migrations/20250606000000_fix_security_issues.sql`
3. Review the SQL to understand what it will do
4. Click "Run" to apply the fixes
5. You should see success messages in the output

## Step 4: Enable Leaked Password Protection
1. Go to: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/auth/providers
2. Find "Email" provider settings
3. Enable "Leaked Password Protection"
4. Click "Save"

## Step 5: Verify Fixes
1. Go back to SQL Editor
2. Run the security_pre_check.sql query again
3. Verify that the issues are resolved

## What the Fixes Do:
- ✅ Removes SECURITY DEFINER from the popular_templates_v view
- ✅ Sets secure search_path for all functions to prevent injection attacks
- ✅ Moves extensions to a dedicated schema (if possible)
- ✅ Documents the need for leaked password protection

## If You Need to Rollback:
Only if the fixes cause issues, you can rollback by running:
`/Users/emilyschwartzman/assemblage-app/supabase/migrations/20250606000000_rollback_security_fixes.sql.rollback`

## Direct Links:
- SQL Editor: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/sql
- Auth Settings: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/auth/providers
- Database Backups: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/settings/general

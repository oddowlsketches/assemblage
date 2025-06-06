# Direct Database Commands for Security Fixes

Since you're having issues with the psql command, here are the steps to fix the security issues:

## Option 1: Using Supabase CLI (Recommended)

First, make sure you're in the assemblage-app directory and run:

```bash
# Install Supabase CLI if you haven't already
brew install supabase/tap/supabase

# Make the scripts executable
chmod +x fix_security.sh run_security_check.sh

# Run the security check
./run_security_check.sh

# Or use the interactive menu
./fix_security.sh
```

## Option 2: Using Supabase Dashboard SQL Editor

1. Go to your Supabase Dashboard: https://qpvuwzztqqeyqxkrnhfr.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/security_pre_check.sql` to see current issues
4. After reviewing, copy and paste the contents of `supabase/migrations/20250606000000_fix_security_issues.sql` to apply fixes

## Option 3: Using Direct PostgreSQL Connection

Your database connection details:
- Host: `db.qpvuwzztqqeyqxkrnhfr.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: Use your service role key from .env file

Connection string:
```
postgresql://postgres:[YOUR_SERVICE_ROLE_KEY]@db.qpvuwzztqqeyqxkrnhfr.supabase.co:5432/postgres
```

## Option 4: Using Supabase CLI Database Commands

```bash
# Link your project (only needed once)
supabase link --project-ref qpvuwzztqqeyqxkrnhfr

# Run the pre-check
supabase db execute -f supabase/security_pre_check.sql

# Apply the migration
cd supabase
supabase db push
cd ..
```

## Important Manual Step

After applying the SQL fixes, you MUST:

1. Go to: https://qpvuwzztqqeyqxkrnhfr.supabase.co/project/qpvuwzztqqeyqxkrnhfr/auth/providers
2. Enable "Leaked Password Protection"
3. Save the changes

This cannot be done via SQL and must be enabled in the dashboard.

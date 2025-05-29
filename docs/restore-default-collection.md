# Restore Default Collection Images

## Overview

This document describes the process for restoring missing images in the default CMS collection after a database corruption incident.

## Background

During debugging, Cursor inadvertently wiped most rows from the `images` table. A manual restore brought back ~495 rows but with stale metadata and ~120 images still missing. All affected images belonged to the CMS "default" collection (collection_id = `00000000-0000-0000-0000-000000000001`).

## Issue Summary

1. **Missing Database Entries**: Some files exist in storage buckets but have no corresponding database entries
2. **Missing Storage Files**: Some database entries point to files that no longer exist in storage
3. **Stale Metadata**: Restored entries have `metadata_status` != 'ready' and are missing processed data
4. **Path Mismatches**: Some entries have incorrect bucket prefixes (e.g., `user-images/` instead of `cms-images/`)

## Recovery Process

### Step 1: Run Diagnostic Script

The diagnostic script inventories all storage objects and database entries to identify discrepancies:

```bash
cd ~/code/assemblage  # or your assemblage-app directory
ts-node scripts/inventory_storage_vs_db.ts
```

This generates:
- `scripts/diagnostics/<timestamp>/missing_in_db.csv` - Files in storage without DB entries
- `scripts/diagnostics/<timestamp>/missing_in_storage.csv` - DB entries without storage files
- `scripts/diagnostics/<timestamp>/stale_metadata.csv` - Entries with incomplete metadata
- `scripts/diagnostics/<timestamp>/restore_default_collection.sql` - SQL script to fix issues

### Step 2: Review Generated SQL

**IMPORTANT**: Always review the SQL before executing!

```bash
# Open and review the generated SQL file
cat scripts/diagnostics/<timestamp>/restore_default_collection.sql
```

The SQL will contain:
- INSERT statements for files missing from the database
- UPDATE statements to mark entries with missing files as errored

### Step 3: Execute Database Restoration

After reviewing, execute the SQL:

```bash
# Using psql
psql $SUPABASE_DB_URL -f scripts/diagnostics/<timestamp>/restore_default_collection.sql

# Or using Supabase CLI
supabase db push < scripts/diagnostics/<timestamp>/restore_default_collection.sql
```

### Step 4: Process Pending Images

The restoration marks new entries as 'pending'. Process them to generate metadata:

```bash
# Process images in batches (respects rate limits)
supabase functions invoke process_image --payload '{"force":true}'
```

This will:
- Generate thumbnails
- Extract color palettes
- Create CLIP embeddings
- Update metadata_status to 'ready'

### Step 5: Apply Path Fix (Temporary)

Until database paths are migrated, the CollageService includes a patch to handle incorrect bucket prefixes. This is already implemented in the code.

## Safety Measures

1. **No Destructive Operations**: The script only reads from storage and database
2. **Transaction Safety**: All SQL operations are wrapped in BEGIN/COMMIT
3. **Manual Review Required**: SQL must be reviewed before execution
4. **Idempotent Design**: Scripts can be run multiple times safely

## Rate Limiting

The `process_image` function respects the `MAX_EMBEDDING_CALLS_PER_MIN` environment variable to avoid API rate limits. Default is 20 calls per minute.

## Future Improvements

1. **Path Migration**: Update all database entries to remove bucket prefixes
2. **Automated Backup**: Implement regular database backups
3. **Validation Hook**: Add pre-delete validation to prevent accidental data loss
4. **Storage Sync**: Implement two-way sync between storage and database

## Troubleshooting

### "Missing environment variables" error
Ensure `.env` contains:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### "Cannot find module" error
Install dependencies:
```bash
npm install @supabase/supabase-js dotenv
```

### Storage access errors
Verify the service role key has admin access to storage buckets.

### Rate limit errors
Reduce `MAX_EMBEDDING_CALLS_PER_MIN` in environment variables.

#!/bin/bash
# Recovery Commands for Assemblage Default Collection
# Run these commands in order after reviewing each step

# Step 1: Run diagnostic to identify issues
echo "=== Step 1: Running diagnostic script ==="
cd ~/code/assemblage  # Update path if needed
ts-node scripts/inventory_storage_vs_db.ts

# Step 2: Review the generated files
echo -e "\n=== Step 2: Review generated files ==="
TIMESTAMP=$(ls -t scripts/diagnostics | head -n1)
echo "Diagnostic results saved to: scripts/diagnostics/$TIMESTAMP"
echo ""
echo "Review CSVs:"
echo "  - missing_in_db.csv: Files in storage without DB entries"
echo "  - missing_in_storage.csv: DB entries without storage files" 
echo "  - stale_metadata.csv: Entries with incomplete metadata"
echo ""
echo "To view summaries:"
echo "  wc -l scripts/diagnostics/$TIMESTAMP/*.csv"
echo ""
echo "To review SQL (IMPORTANT - review before executing!):"
echo "  cat scripts/diagnostics/$TIMESTAMP/restore_default_collection.sql | less"

# Step 3: Execute restoration (after manual review)
echo -e "\n=== Step 3: Execute database restoration ==="
echo "After reviewing the SQL, execute with ONE of these commands:"
echo ""
echo "Option A - Using psql directly:"
echo "  psql \$SUPABASE_DB_URL -f scripts/diagnostics/$TIMESTAMP/restore_default_collection.sql"
echo ""
echo "Option B - Using Supabase CLI:"
echo "  supabase db push < scripts/diagnostics/$TIMESTAMP/restore_default_collection.sql"

# Step 4: Process pending images
echo -e "\n=== Step 4: Process pending images ==="
echo "Option A - Use batch processing script (recommended):"
echo "  ts-node scripts/batch_process_images.ts"
echo ""
echo "Option B - Direct edge function invoke:"
echo "  supabase functions invoke process_image --payload '{\"force\":true}'"

# Step 5: Verify results
echo -e "\n=== Step 5: Verify restoration ==="
echo "Check pending image count:"
echo "  psql \$SUPABASE_DB_URL -c \"SELECT COUNT(*) FROM images WHERE metadata_status = 'pending' AND provider = 'cms'\""
echo ""
echo "Check error count:"
echo "  psql \$SUPABASE_DB_URL -c \"SELECT COUNT(*) FROM images WHERE metadata_status = 'error' AND provider = 'cms'\""

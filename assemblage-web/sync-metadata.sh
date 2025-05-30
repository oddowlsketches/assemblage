#!/bin/bash

# Script to manually sync metadata and process pending images

echo "🔄 Starting metadata sync process..."
echo ""

# Step 1: Sync metadata column for existing images
echo "📊 Step 1: Syncing metadata column for images with existing tags/descriptions..."
curl -X POST https://assemblage-app.netlify.app/.netlify/functions/sync-metadata-column \
  -H "Content-Type: application/json" \
  --silent --show-error | jq '.' || echo "Response: $(curl -X POST https://assemblage-app.netlify.app/.netlify/functions/sync-metadata-column --silent)"

echo ""
echo "⏳ Waiting 5 seconds before processing pending metadata..."
sleep 5

# Step 2: Process any pending metadata
echo ""
echo "🤖 Step 2: Processing images with pending metadata..."
curl -X POST https://assemblage-app.netlify.app/.netlify/functions/process-pending-metadata \
  -H "Content-Type: application/json" \
  --silent --show-error | jq '.' || echo "Response: $(curl -X POST https://assemblage-app.netlify.app/.netlify/functions/process-pending-metadata --silent)"

echo ""
echo "✅ Metadata sync process complete!"
echo ""
echo "💡 To check the status of your images, run this SQL query in Supabase:"
echo "   SELECT COUNT(*), metadata_status FROM images GROUP BY metadata_status;"

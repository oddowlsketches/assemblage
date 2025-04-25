#!/bin/bash

# Fix image validation in the tiling generator

echo "Fixing image validation in tiling generator..."

# Make a backup of the current version if one doesn't already exist
if [ ! -f js/collage/tilingGenerator.js.original ]; then
  cp js/collage/tilingGenerator.js js/collage/tilingGenerator.js.original
  echo "Original file backed up to js/collage/tilingGenerator.js.original"
else
  echo "Backup already exists at js/collage/tilingGenerator.js.original"
fi

# Extract the current version of the tiling implementation
TARGET_FILE=js/collage/tilingGenerator.js

# Check which implementation is being used (current or April 10)
if grep -q "allowImageRepetition" "$TARGET_FILE"; then
  echo "Found image repetition logic in current tiling generator - updating validation..."
  
  # Find the generateTile method in the current implementation and replace it
  awk '
  BEGIN { p=1; inFunction=0; }
  /async generateTile\(/ { inFunction=1; print; next; }
  inFunction==1 && /^    \}/ { inFunction=0; print; next; }
  inFunction==1 { next; } # Skip the original function content
  { if (p) print; }
  ' "$TARGET_FILE" > "$TARGET_FILE.tmp1"
  
  # Extract the new implementation from the fix file
  awk '
  BEGIN { p=0; inFunction=0; }
  /async generateTile\(/ { inFunction=1; print; next; }
  inFunction==1 { print; }
  inFunction==1 && /^    \}/ { inFunction=0; p=0; }
  ' fix_image_validation.js > "$TARGET_FILE.tmp2"
  
  # Combine the files
  head -n $(grep -n "async generateTile" "$TARGET_FILE.tmp1" | head -1 | cut -d':' -f1) "$TARGET_FILE.tmp1" > "$TARGET_FILE.new"
  cat "$TARGET_FILE.tmp2" >> "$TARGET_FILE.new"
  tail -n +$(grep -n -A1 "async generateTile" "$TARGET_FILE.tmp1" | tail -1 | cut -d'-' -f1) "$TARGET_FILE.tmp1" >> "$TARGET_FILE.new"
  
  # Replace the original file
  mv "$TARGET_FILE.new" "$TARGET_FILE"
  
  # Clean up temp files
  rm "$TARGET_FILE.tmp1" "$TARGET_FILE.tmp2"
  
  echo "✅ Image validation fix applied successfully!"
  echo "Please refresh your test page to see the fixed collages."
else
  echo "⚠️ The tiling generator doesn't have the image repetition logic."
  echo "Please run the full tiling generator fix first:"
  echo "./install_improved_tiling.sh"
fi
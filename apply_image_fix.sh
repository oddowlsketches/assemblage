#!/bin/bash

# Apply the simple image validation fix to tilingGenerator.js

echo "Applying image validation fix..."

# Backup the current file if it doesn't have a backup yet
if [ ! -f js/collage/tilingGenerator.js.original ]; then
  cp js/collage/tilingGenerator.js js/collage/tilingGenerator.js.original
  echo "Original file backed up to js/collage/tilingGenerator.js.original"
fi

# Replace the strict image validation with the more relaxed version
sed -i '' 's/if (!selectedImage || !selectedImage.complete || !(selectedImage instanceof HTMLImageElement)) {/if (!selectedImage) {/g' js/collage/tilingGenerator.js

echo "✅ Fix applied! The tiling collage should work now."
echo "Refresh your test page to see if the collages appear."
echo ""
echo "If you still have issues, you can restore the original with:"
echo "cp js/collage/tilingGenerator.js.original js/collage/tilingGenerator.js"

# Make it executable
chmod +x apply_image_fix.sh

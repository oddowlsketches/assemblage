#!/bin/bash

# Backup the current version of the file
cp js/collage/tilingGenerator.js js/collage/tilingGenerator.js.bak

# Replace with our fixed version
cp js/collage/newTilingGenerator.js js/collage/tilingGenerator.js

echo "Tiling generator replaced with fixed version. Original backed up to tilingGenerator.js.bak"
echo "Now your tiling collage should work with both repeating and non-repeating images."

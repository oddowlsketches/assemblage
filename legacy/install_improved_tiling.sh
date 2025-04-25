#!/bin/bash

# Backup the current version of the file
cp js/collage/tilingGenerator.js js/collage/tilingGenerator.js.bak

# Install the improved tiling generator
cp js/collage/improvedTilingGenerator.js js/collage/tilingGenerator.js

echo "✨ Improved tiling generator installed! Original backed up to tilingGenerator.js.bak"
echo "This version includes:"
echo "- Max 3 repeats per image (controlled by allowImageRepetition setting)"
echo "- Better dramatic scaling variation"
echo "- Random tile count selection (25-120 range)"
echo "- Aspect ratio preservation for all images"
echo "- Strategic positioning for focal tiles"
echo "- Improved opacity distribution"

# Make it executable
chmod +x install_improved_tiling.sh

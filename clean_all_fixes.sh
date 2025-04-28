#!/bin/bash

# Clean All Fixes and Diagnostic Tools
# This script removes all fixes and diagnostic tools from index.html

echo "Assemblage Clean All Fixes"
echo "-------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-clean-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Remove all fix scripts and diagnostic tools
echo "Removing all fix scripts and diagnostic tools..."

# Remove script tags and comments
sed -i '' '/<!-- Image Quality Fix -->/d' index.html
sed -i '' '/fix_scaling_parameters.js/d' index.html
sed -i '' '/fix_drawing_quality.js/d' index.html
sed -i '' '/<!-- Simplified Image Quality Fix -->/d' index.html
sed -i '' '/simplified_image_quality_fix.js/d' index.html
sed -i '' '/<!-- Minimal Scaling Fix -->/d' index.html
sed -i '' '/minimal_scaling_fix.js/d' index.html
sed -i '' '/<!-- Diagnostic Tools -->/d' index.html
sed -i '' '/diagnose_effects.js/d' index.html
sed -i '' '/effect_tester.js/d' index.html

echo "All fix scripts and diagnostic tools have been removed."
echo "Your index.html file has been restored to its original state."
echo ""
echo "Please reload your page to verify that all tools and fixes have been removed."
echo "-------------------------"
echo "Done."

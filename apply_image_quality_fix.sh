#!/bin/bash

# Apply Image Quality Fix for Assemblage
# This script safely applies fixes for image resolution issues

echo "Assemblage Image Quality Fix"
echo "---------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if fix scripts exist
if [ ! -f "js/fix_scaling_parameters.js" ] || [ ! -f "js/fix_drawing_quality.js" ]; then
    echo "Error: Fix scripts not found in js directory."
    echo "Please make sure the following files exist:"
    echo "  - js/fix_scaling_parameters.js"
    echo "  - js/fix_drawing_quality.js"
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-quality-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the fix scripts to index.html
echo "Adding image quality fix scripts to index.html..."

# Check if fixes are already applied
if grep -q "fix_scaling_parameters.js" index.html && grep -q "fix_drawing_quality.js" index.html; then
    echo "Fix scripts are already added to index.html."
else
    # Add the scripts before the closing body tag
    sed -i '' 's/<\/body>/    <!-- Image Quality Fix -->\
    <script src="js\/fix_scaling_parameters.js"><\/script>\
    <script src="js\/fix_drawing_quality.js"><\/script>\
<\/body>/' index.html

    # Check if the script was successfully added
    if grep -q "fix_scaling_parameters.js" index.html && grep -q "fix_drawing_quality.js" index.html; then
        echo "Image quality fix scripts successfully added to index.html."
    else
        echo "Error: Failed to add fix scripts to index.html."
        echo "Please add the following lines manually before the closing </body> tag:"
        echo '<script src="js/fix_scaling_parameters.js"></script>'
        echo '<script src="js/fix_drawing_quality.js"></script>'
    fi
fi

echo "Done! Please open index.html in your browser to see the improvements."
echo "If you experience any issues, you can restore from the backup."
echo "---------------------------"

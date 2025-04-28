#!/bin/bash

# Apply Simplified Image Quality Fix for Assemblage
# This script installs the simplified version of the image quality fix

echo "Assemblage Simplified Image Quality Fix"
echo "-------------------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if previous fix scripts are installed
if grep -q "fix_scaling_parameters.js\|fix_drawing_quality.js" index.html; then
    echo "Previous fix scripts detected. Removing them first..."
    # Remove previous fix scripts
    sed -i '' '/<!-- Image Quality Fix -->/d' index.html
    sed -i '' '/fix_scaling_parameters.js/d' index.html
    sed -i '' '/fix_drawing_quality.js/d' index.html
    echo "Previous fix scripts removed."
fi

# Check if fix script exists
if [ ! -f "js/simplified_image_quality_fix.js" ]; then
    echo "Error: Fix script not found."
    echo "Please make sure the following file exists:"
    echo "  - js/simplified_image_quality_fix.js"
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-simplified-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the fix script to index.html
echo "Adding simplified image quality fix script to index.html..."
sed -i '' 's/<\/body>/    <!-- Simplified Image Quality Fix -->\
    <script src="js\/simplified_image_quality_fix.js"><\/script>\
<\/body>/' index.html

# Check if the script was successfully added
if grep -q "simplified_image_quality_fix.js" index.html; then
    echo "Simplified image quality fix script successfully added to index.html."
    echo "Success! The simplified image quality fix has been applied."
    echo "Please open index.html in your browser to see the improvements."
else
    echo "Error: Failed to add fix script to index.html."
    echo "Please add the following line manually before the closing </body> tag:"
    echo '<script src="js/simplified_image_quality_fix.js"></script>'
fi

echo "-------------------------------------"
echo "Done."

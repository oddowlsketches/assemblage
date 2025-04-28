#!/bin/bash

# Apply Minimal Scaling Fix for Assemblage
# This script installs the minimal version of the scaling fix

echo "Assemblage Minimal Scaling Fix"
echo "-----------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if previous fix scripts are installed
if grep -q "fix_scaling_parameters.js\|fix_drawing_quality.js\|simplified_image_quality_fix.js" index.html; then
    echo "Previous fix scripts detected. Removing them first..."
    # Remove previous fix script tags and comments
    sed -i '' '/<!-- Image Quality Fix -->/d' index.html
    sed -i '' '/fix_scaling_parameters.js/d' index.html
    sed -i '' '/fix_drawing_quality.js/d' index.html
    sed -i '' '/<!-- Simplified Image Quality Fix -->/d' index.html
    sed -i '' '/simplified_image_quality_fix.js/d' index.html
    echo "Previous fix scripts removed."
fi

# Check if fix script exists
if [ ! -f "js/minimal_scaling_fix.js" ]; then
    echo "Error: Fix script not found."
    echo "Please make sure the following file exists:"
    echo "  - js/minimal_scaling_fix.js"
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-minimal-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the fix script to index.html
echo "Adding minimal scaling fix script to index.html..."
sed -i '' 's/<\/body>/    <!-- Minimal Scaling Fix -->\
    <script src="js\/minimal_scaling_fix.js"><\/script>\
<\/body>/' index.html

# Check if the script was successfully added
if grep -q "minimal_scaling_fix.js" index.html; then
    echo "Minimal scaling fix script successfully added to index.html."
    echo "Success! The minimal scaling fix has been applied."
    echo "Please open index.html in your browser to see the improvements."
else
    echo "Error: Failed to add fix script to index.html."
    echo "Please add the following line manually before the closing </body> tag:"
    echo '<script src="js/minimal_scaling_fix.js"></script>'
fi

echo "-----------------------------"
echo "Done."

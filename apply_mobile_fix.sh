#!/bin/bash

# Apply Enhanced Mobile Resolution Fix for Assemblage
# This script will apply the enhanced_mobile_fix.js to index.html

echo "Assemblage Enhanced Mobile Resolution Fix"
echo "-----------------------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if enhanced_mobile_fix.js exists
if [ ! -f "enhanced_mobile_fix.js" ]; then
    echo "Error: enhanced_mobile_fix.js not found."
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-mobile-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the fix script to index.html
echo "Adding enhanced mobile fix script to index.html..."
sed -i '' 's/<\/body>/    <!-- Enhanced Mobile Resolution Fix -->\n    <script src="enhanced_mobile_fix.js"><\/script>\n<\/body>/' index.html

# Check if the script was successfully added
if grep -q "enhanced_mobile_fix.js" index.html; then
    echo "Enhanced mobile fix script successfully added to index.html."
    echo "Success! The enhanced mobile resolution fix has been applied."
    echo "Please open index.html in your browser to see the changes."
else
    echo "Error: Failed to add the enhanced mobile fix script to index.html."
    echo "Please add the following line manually before the closing </body> tag:"
    echo '<script src="enhanced_mobile_fix.js"></script>'
fi

echo "-----------------------------------------"
echo "Done."

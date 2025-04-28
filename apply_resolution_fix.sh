#!/bin/bash

# Apply Canvas Resolution Fix for Assemblage
# This script will apply the fix_canvas_resolution.js to index.html

echo "Assemblage Canvas Resolution Fix"
echo "--------------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if fix_canvas_resolution.js exists
if [ ! -f "fix_canvas_resolution.js" ]; then
    echo "Error: fix_canvas_resolution.js not found."
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-resolution-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the fix script to index.html
echo "Adding resolution fix script to index.html..."
sed -i '' 's/<\/body>/    <!-- Canvas Resolution Fix -->\n    <script src="fix_canvas_resolution.js" type="module"><\/script>\n<\/body>/' index.html

# Check if the script was successfully added
if grep -q "fix_canvas_resolution.js" index.html; then
    echo "Resolution fix script successfully added to index.html."
    echo "Success! The canvas resolution fix has been applied."
    echo "Please open index.html in your browser to see the changes."
else
    echo "Error: Failed to add the resolution fix script to index.html."
    echo "Please add the following line manually before the closing </body> tag:"
    echo '<script src="fix_canvas_resolution.js" type="module"></script>'
fi

echo "--------------------------------"
echo "Done."

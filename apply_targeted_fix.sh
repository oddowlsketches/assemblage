#!/bin/bash

# Apply Targeted Fix for Assemblage
# This script installs the targeted fix for image quality while maintaining all functionality

echo "Assemblage Targeted Fix"
echo "----------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# First, clean up any previous fixes
# Check if previous fix scripts are installed
if grep -q "fix_scaling_parameters.js\|fix_drawing_quality.js\|simplified_image_quality_fix.js\|minimal_scaling_fix.js\|effect_tester.js\|diagnose_effects.js" index.html; then
    echo "Previous fix scripts detected. Removing them first..."
    
    # Remove previous fix script tags and comments
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
    
    echo "Previous fix scripts removed."
fi

# Check if targeted fix script exists
if [ ! -f "js/targeted_fix.js" ]; then
    echo "Error: Targeted fix script not found."
    echo "Please make sure the following file exists:"
    echo "  - js/targeted_fix.js"
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-targeted-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the targeted fix script to index.html
echo "Adding targeted fix script to index.html..."
sed -i '' 's/<\/body>/    <!-- Targeted Image Quality Fix -->\
    <script src="js\/targeted_fix.js"><\/script>\
<\/body>/' index.html

# Check if the script was successfully added
if grep -q "targeted_fix.js" index.html; then
    echo "Targeted fix script successfully added to index.html."
    echo ""
    echo "Success! The targeted fix has been applied."
    echo "This fix is designed to improve image quality while maintaining all functionality,"
    echo "including crystal effects, sliced effects, and masking."
    echo ""
    echo "Please open index.html in your browser to see the improvements."
    echo ""
    echo "If you need to restore original methods, open the browser console and type:"
    echo "  window.restoreOriginalMethods()"
else
    echo "Error: Failed to add fix script to index.html."
    echo "Please add the following line manually before the closing </body> tag:"
    echo '<script src="js/targeted_fix.js"></script>'
fi

echo "----------------------"
echo "Done."

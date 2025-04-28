#!/bin/bash

# Setup Diagnostic Tools for Assemblage
# This script installs the diagnostic tools for troubleshooting

echo "Assemblage Diagnostic Tools Setup"
echo "-------------------------------"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run this script from the Assemblage root directory."
    exit 1
fi

# Check if diagnostic scripts exist
if [ ! -f "js/diagnose_effects.js" ] || [ ! -f "js/effect_tester.js" ]; then
    echo "Error: Diagnostic scripts not found."
    echo "Please make sure the following files exist:"
    echo "  - js/diagnose_effects.js"
    echo "  - js/effect_tester.js"
    exit 1
fi

# Create backup of index.html
echo "Creating backup of index.html..."
cp index.html index.html.backup-diagnostic-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

# Add the diagnostic scripts to index.html
echo "Adding diagnostic scripts to index.html..."
sed -i '' 's/<\/body>/    <!-- Diagnostic Tools -->\
    <script src="js\/diagnose_effects.js"><\/script>\
    <script src="js\/effect_tester.js"><\/script>\
<\/body>/' index.html

# Check if the scripts were successfully added
if grep -q "diagnose_effects.js" index.html && grep -q "effect_tester.js" index.html; then
    echo "Diagnostic scripts successfully added to index.html."
    echo "Success! The diagnostic tools have been installed."
    echo ""
    echo "USAGE INSTRUCTIONS:"
    echo "1. Open index.html in your browser"
    echo "2. Look for the 'Effect Tester' panel in the top-right corner"
    echo "3. Use the buttons to test each effect individually"
    echo "4. Check the browser console for detailed diagnostic information"
    echo ""
else
    echo "Error: Failed to add diagnostic scripts to index.html."
    echo "Please add the following lines manually before the closing </body> tag:"
    echo '<script src="js/diagnose_effects.js"></script>'
    echo '<script src="js/effect_tester.js"></script>'
fi

echo "-------------------------------"
echo "Done."

#!/bin/bash

# Script to fix the drawTile method in collageGenerator.js
# Created on April 10, 2025

# Configuration
FILE_PATH="js/collage/collageGenerator.js"
BACKUP_FILE="${FILE_PATH}.bak.$(date +%Y%m%d%H%M%S)"

# Create backup
echo "Creating backup of $FILE_PATH to $BACKUP_FILE"
cp "$FILE_PATH" "$BACKUP_FILE"

# Define the pattern to search for (the strict validation)
PATTERN="if (!img || !img.complete || !(img instanceof HTMLImageElement)) {"

# Define the replacement (simpler validation with additional logging)
REPLACEMENT="// Modified validation check - removed instanceof HTMLImageElement check\n    if (!img || !img.complete) {\n        console.log(\`Tile \${index}: Image validation failed - img exists: \${!!img}, complete: \${img ? img.complete : 'N/A'}\`);"

# Make the replacement
echo "Modifying $FILE_PATH..."
if sed -i'.tmp' "s/$PATTERN/$REPLACEMENT/g" "$FILE_PATH"; then
    rm "${FILE_PATH}.tmp" # Remove temporary file created by sed
    echo "Successfully modified $FILE_PATH"
    echo "Original file backed up to $BACKUP_FILE"
    echo "Changes made:"
    echo "- Replaced strict image validation with simpler check"
    echo "- Added additional logging for debugging"
else
    echo "Error: Failed to modify $FILE_PATH"
    exit 1
fi

# Add additional diagnostic logging after successful drawing
DRAW_PATTERN="ctx.drawImage(img, dx, dy, dWidth, dHeight);"
DRAW_REPLACEMENT="ctx.drawImage(img, dx, dy, dWidth, dHeight);\n        console.log(\`Tile \${index}: Successfully drawn\`);"

echo "Adding success logging..."
if sed -i'.tmp' "s/$DRAW_PATTERN/$DRAW_REPLACEMENT/g" "$FILE_PATH"; then
    rm "${FILE_PATH}.tmp" # Remove temporary file created by sed
    echo "Successfully added diagnostic logging after drawImage"
else
    echo "Error: Failed to add diagnostic logging"
    exit 1
fi

echo "Fix completed. Please test your application now."
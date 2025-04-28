#!/bin/bash

# Create necessary directories
mkdir -p images/collages
mkdir -p temp_restore

# Get the list of files from the old version
git ls-tree -r --name-only 8294bbc images/collages/ > temp_restore/files.txt

# Process each file from the old version
while IFS= read -r filepath; do
    # Skip if empty line
    [ -z "$filepath" ] && continue
    
    # Extract just the filename
    filename=$(basename "$filepath")
    
    # Skip if the file already exists locally
    if [ -f "images/collages/$filename" ]; then
        echo "Skipping $filename (already exists)"
        continue
    fi
    
    # Extract and save the image
    echo "Restoring $filename"
    git show "8294bbc:$filepath" > "images/collages/$filename" 2>/dev/null
    
    # Check if the file was successfully restored
    if [ $? -eq 0 ] && [ -f "images/collages/$filename" ]; then
        echo "Successfully restored $filename"
    else
        echo "Failed to restore $filename"
    fi
done < temp_restore/files.txt

# Clean up
rm -rf temp_restore

echo "Image restoration complete!" 
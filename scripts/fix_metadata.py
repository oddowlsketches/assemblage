#!/usr/bin/env python3
# Make this script executable: chmod +x fix_metadata.py
"""
Fix metadata.json to ensure consistent format for all images
"""

import os
import json
import sys

# Get the absolute path to the script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
METADATA_FILE = os.path.join(ROOT_DIR, "images", "metadata.json")
COLLAGES_DIR = os.path.join(ROOT_DIR, "images", "collages")

def fix_metadata():
    """Fix metadata.json to ensure consistent format"""
    # Check if the metadata file exists
    if not os.path.exists(METADATA_FILE):
        print(f"Error: Metadata file not found at {METADATA_FILE}")
        return
    
    print(f"Processing metadata file: {METADATA_FILE}")
    
    # Load the existing metadata
    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)
    
    print(f"Found {len(metadata)} entries in metadata.json")
    
    # Track different formats
    with_src = 0
    with_path = 0
    
    # Update each entry to use consistent format
    updated_metadata = []
    for entry in metadata:
        # Convert "path" to "src" if it exists
        if 'path' in entry:
            filename = os.path.basename(entry['path'])
            entry['src'] = filename
            del entry['path']
            with_path += 1
        
        # Verify src field exists
        if 'src' not in entry:
            print(f"Warning: Entry without src field: {entry}")
            continue
        
        with_src += 1
        
        # Verify the image file exists
        image_path = os.path.join(COLLAGES_DIR, entry['src'])
        if not os.path.exists(image_path):
            print(f"Warning: Image file not found: {image_path}")
        
        updated_metadata.append(entry)
    
    print(f"Statistics:")
    print(f"- Entries with 'src': {with_src}")
    print(f"- Entries with 'path' (converted): {with_path}")
    print(f"- Total valid entries: {len(updated_metadata)}")
    
    # Backup original file
    backup_file = f"{METADATA_FILE}.backup"
    print(f"Creating backup at {backup_file}")
    with open(backup_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Save the updated metadata
    print(f"Saving updated metadata to {METADATA_FILE}")
    with open(METADATA_FILE, 'w') as f:
        json.dump(updated_metadata, f, indent=2)
    
    print(f"Metadata updated successfully")

if __name__ == "__main__":
    fix_metadata()

#!/usr/bin/env python3
"""
Synchronize metadata.json with actual files in the collages directory
"""

import os
import json
import sys

# Get the absolute path to the script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
METADATA_FILE = os.path.join(ROOT_DIR, "images", "metadata.json")
COLLAGES_DIR = os.path.join(ROOT_DIR, "images", "collages")
UPLOADS_DIR = os.path.join(ROOT_DIR, "uploads")

def sync_metadata():
    """Sync metadata.json with actual files in the collages directory"""
    # Check if the metadata file exists
    if not os.path.exists(METADATA_FILE):
        print(f"Error: Metadata file not found at {METADATA_FILE}")
        return
    
    print(f"Processing metadata file: {METADATA_FILE}")
    
    # Load the existing metadata
    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)
    
    print(f"Found {len(metadata)} entries in metadata.json")
    
    # Get the list of actual image files in the collages directory
    image_files = os.listdir(COLLAGES_DIR)
    print(f"Found {len(image_files)} files in collages directory")
    
    # Create a set of image filenames for quick lookups
    image_files_set = set(image_files)
    
    # Track statistics
    found_entries = 0
    missing_files = 0
    
    # Filter metadata to only include entries for existing files
    valid_metadata = []
    invalid_entries = []
    
    for entry in metadata:
        # Get the filename from the entry
        filename = entry.get('src')
        if not filename:
            if entry.get('path'):
                # Extract filename from path
                filename = os.path.basename(entry['path'])
                # Update the entry to use src instead of path
                entry['src'] = filename
                if 'path' in entry:
                    del entry['path']
            else:
                print(f"Warning: Entry without src or path: {entry}")
                invalid_entries.append(entry)
                continue
        
        # Check if the file exists
        if filename in image_files_set:
            valid_metadata.append(entry)
            found_entries += 1
        else:
            print(f"Warning: File not found for entry: {filename}")
            missing_files += 1
            invalid_entries.append(entry)
    
    print(f"Summary:")
    print(f"- Valid entries (file exists): {found_entries}")
    print(f"- Invalid entries (file missing): {missing_files}")
    
    # Backup original file
    backup_file = f"{METADATA_FILE}.backup"
    print(f"Creating backup at {backup_file}")
    with open(backup_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Save the filtered metadata
    print(f"Saving updated metadata to {METADATA_FILE}")
    with open(METADATA_FILE, 'w') as f:
        json.dump(valid_metadata, f, indent=2)
    
    print(f"Metadata updated successfully")
    
    # Print invalid entries for reference
    if invalid_entries:
        print("\nInvalid entries (for reference):")
        for entry in invalid_entries[:10]:  # Show first 10 only
            print(f"- {entry.get('id')}: {entry.get('src') or entry.get('path')}")
        if len(invalid_entries) > 10:
            print(f"... and {len(invalid_entries) - 10} more")

if __name__ == "__main__":
    sync_metadata()

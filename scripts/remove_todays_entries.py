#!/usr/bin/env python3

import json
import os
from datetime import datetime

def remove_todays_entries():
    """Remove entries from today from metadata.json."""
    metadata_path = 'images/metadata.json'
    today = datetime.now().strftime('%Y%m%d')
    
    # Read the current metadata
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # Get list of today's files
    todays_files = set()
    for file in os.listdir('images/todays_backup'):
        if file.endswith('.jpg'):
            todays_files.add(file.split('.')[0])
    
    # Filter out today's entries
    cleaned_metadata = [entry for entry in metadata if entry['id'] not in todays_files]
    
    # Write back the cleaned metadata
    with open(metadata_path, 'w') as f:
        json.dump(cleaned_metadata, f, indent=2)
    
    removed_count = len(metadata) - len(cleaned_metadata)
    print(f"Removed {removed_count} entries from today")
    print(f"Kept {len(cleaned_metadata)} entries from previous days")

if __name__ == '__main__':
    remove_todays_entries() 
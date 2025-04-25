#!/usr/bin/env python3

import json
import os
from datetime import datetime

def clean_metadata():
    """Remove entries from today from metadata.json."""
    metadata_path = 'images/metadata.json'
    today = datetime.now().strftime('%Y%m%d')
    
    # Read the current metadata
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # Filter out entries from today
    cleaned_metadata = [entry for entry in metadata if not entry['id'].startswith(today)]
    
    # Write back the cleaned metadata
    with open(metadata_path, 'w') as f:
        json.dump(cleaned_metadata, f, indent=2)
    
    removed_count = len(metadata) - len(cleaned_metadata)
    print(f"Removed {removed_count} entries from today")
    print(f"Kept {len(cleaned_metadata)} entries from previous days")

if __name__ == '__main__':
    clean_metadata() 
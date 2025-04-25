#!/usr/bin/env python3
"""
Merge GitHub and local metadata files
"""

import json
import os
import subprocess

def get_github_metadata():
    """Get metadata from the last GitHub commit"""
    try:
        result = subprocess.run(['git', 'show', 'HEAD:images/metadata.json'], 
                              capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error getting GitHub metadata: {e}")
        return []

def merge_metadata():
    """Merge GitHub and local metadata files"""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    local_metadata_path = os.path.join(root_dir, "images", "metadata.json")
    
    # Load local metadata
    with open(local_metadata_path, 'r') as f:
        local_metadata = json.load(f)
    
    # Get GitHub metadata
    github_metadata = get_github_metadata()
    
    # Create a dictionary of local metadata by ID
    local_by_id = {entry['id']: entry for entry in local_metadata}
    
    # Merge metadata
    merged_metadata = []
    seen_ids = set()
    
    # First add all GitHub entries
    for entry in github_metadata:
        if entry['id'] not in seen_ids:
            merged_metadata.append(entry)
            seen_ids.add(entry['id'])
    
    # Then add any local entries that aren't in GitHub
    for entry in local_metadata:
        if entry['id'] not in seen_ids:
            merged_metadata.append(entry)
            seen_ids.add(entry['id'])
    
    # Save merged metadata
    with open(local_metadata_path, 'w') as f:
        json.dump(merged_metadata, f, indent=2)
    
    print(f"Original local entries: {len(local_metadata)}")
    print(f"GitHub entries: {len(github_metadata)}")
    print(f"Merged entries: {len(merged_metadata)}")
    print(f"New entries added: {len(merged_metadata) - len(local_metadata)}")

if __name__ == "__main__":
    merge_metadata() 
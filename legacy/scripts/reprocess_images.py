#!/usr/bin/env python3
"""
Script to reprocess existing images with improved mobile-friendly settings.
"""

import os
import sys
from PIL import Image
import json
from pathlib import Path

# Import configuration from image_processor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.image_processor import process_image, COLLAGES_DIR, METADATA_FILE, TARGET_SIZE, JPEG_QUALITY

def should_reprocess_image(img_path):
    """Check if an image needs reprocessing based on its current properties."""
    try:
        with Image.open(img_path) as img:
            # Check if image is already JPEG
            if img.format != 'JPEG':
                return True, "Not a JPEG file"
            
            # Check if image dimensions are already within target size
            if max(img.size) <= max(TARGET_SIZE):
                return False, "Already within target size"
            
            # Check if image quality is already good
            if hasattr(img, 'info') and 'quality' in img.info:
                if img.info['quality'] >= JPEG_QUALITY:
                    return False, "Already at target quality"
            
            return True, "Needs optimization"
    except Exception as e:
        return True, f"Error checking image: {str(e)}"

def reprocess_all_images():
    """Reprocess all existing images in the collages directory."""
    print("Starting image reprocessing...")
    
    # Load existing metadata
    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)
    
    # Create a backup of the original images
    backup_dir = os.path.join(COLLAGES_DIR, 'backup')
    os.makedirs(backup_dir, exist_ok=True)
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Process each image
    for entry in metadata:
        image_id = entry['id']
        image_path = os.path.join(COLLAGES_DIR, f"{image_id}.jpg")
        
        if not os.path.exists(image_path):
            print(f"Warning: Image not found: {image_path}")
            continue
            
        try:
            # Check if image needs reprocessing
            needs_reprocess, reason = should_reprocess_image(image_path)
            
            if not needs_reprocess:
                print(f"⏩ Skipped {image_id}: {reason}")
                skipped_count += 1
                continue
            
            # Create backup
            backup_path = os.path.join(backup_dir, f"{image_id}.jpg")
            if not os.path.exists(backup_path):
                Image.open(image_path).save(backup_path)
                print(f"📦 Backed up: {image_id}")
            
            # Process image with new settings
            processed_path = process_image(image_path)
            
            # Move processed image back to original location
            if os.path.exists(processed_path):
                os.replace(processed_path, image_path)
                processed_count += 1
                print(f"✓ Reprocessed: {image_id}")
            else:
                print(f"✗ Failed to process: {image_id}")
                error_count += 1
                
        except Exception as e:
            print(f"✗ Error processing {image_id}: {str(e)}")
            error_count += 1
    
    print(f"\nReprocessing complete:")
    print(f"- Successfully processed: {processed_count} images")
    print(f"- Skipped (already optimized): {skipped_count} images")
    print(f"- Errors encountered: {error_count} images")
    print(f"- Original images backed up to: {backup_dir}")

if __name__ == '__main__':
    reprocess_all_images() 
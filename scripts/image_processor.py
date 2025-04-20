#!/usr/bin/env python3
"""
Image Processor for Assemblage

This script handles:
1. Processing uploaded images (resize, convert to B&W if needed)
2. Updating metadata.json with new image information
3. Serving a simple API endpoint for the upload tool to interact with

Usage:
    python image_processor.py

Requirements:
    - Python 3.6+
    - Pillow (PIL) for image processing
    - Flask for the web server
"""

import os
import sys
import json
import uuid
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageOps
import shutil
import openai
import requests
from io import BytesIO
from config import OPENAI_API_KEY, IMAGE_PROCESSOR_PORT, TARGET_SIZE, JPEG_QUALITY, CONVERT_TO_BW
import base64
import hashlib
import io
from werkzeug.utils import secure_filename

# -------------------- Configuration --------------------

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(ROOT_DIR, "images")
COLLAGES_DIR = os.path.join(IMAGES_DIR, "collages")
METADATA_FILE = os.path.join(IMAGES_DIR, "metadata.json")
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")

# Create required directories if they don't exist
os.makedirs(COLLAGES_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------- Image Processing Functions --------------------

def process_image(image_path):
    """Process an image for web use."""
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Calculate dimensions while preserving aspect ratio
            width, height = img.size
            max_dimension = max(TARGET_SIZE)
            ratio = min(max_dimension / width, max_dimension / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            # Resize using high-quality LANCZOS resampling
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create a white background of target size
            background = Image.new('RGB', TARGET_SIZE, (255, 255, 255))
            
            # Calculate position to center the image
            x = (TARGET_SIZE[0] - new_width) // 2
            y = (TARGET_SIZE[1] - new_height) // 2
            
            # Paste the resized image onto the white background
            background.paste(img, (x, y))
            
            # Save with high quality
            output_path = os.path.join(UPLOAD_FOLDER, f'processed_{os.path.basename(image_path)}')
            background.save(output_path, 'JPEG', quality=95, optimize=True)
            
            print(f"✓ Processed image saved to {output_path}")
            return output_path
            
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        raise

def generate_metadata(image_path):
    """Generate metadata for an image using OpenAI's Vision API."""
    print("\n" + "="*50)
    print(f"Processing metadata for image: {os.path.basename(image_path)}")
    print("="*50)
    
    try:
        # Read and encode the image
        with open(image_path, "rb") as image_file:
            print("✓ Image encoded successfully")
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Try different model names in sequence
        model_names = ["gpt-4-vision", "gpt-4o", "gpt-4o-vision"]
        last_error = None
        
        for model_name in model_names:
            try:
                print(f"Trying model: {model_name}")
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze this black and white collage image. Provide a detailed description of its composition, textures, and artistic elements. Also suggest 5 relevant tags that capture its essence. Format your response as: DESCRIPTION: [your description] TAGS: [tag1, tag2, tag3, tag4, tag5]"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=300
                )
                
                # Parse the response
                content = response.choices[0].message.content
                print(f"✓ Received response from OpenAI API")
                
                # Extract description and tags
                description = ""
                tags = []
                
                if "DESCRIPTION:" in content and "TAGS:" in content:
                    desc_part = content.split("DESCRIPTION:")[1].split("TAGS:")[0].strip()
                    tags_part = content.split("TAGS:")[1].strip()
                    
                    description = desc_part
                    tags = [tag.strip() for tag in tags_part.strip("[]").split(",")]
                
                print(f"✓ Parsed metadata:")
                print(f"  Description: {description}")
                print(f"  Tags: {', '.join(tags)}")
                
                return {
                    'description': description,
                    'tags': tags
                }
                
            except Exception as e:
                print(f"Error with model {model_name}: {str(e)}")
                last_error = e
                continue
        
        # If we get here, all models failed
        raise last_error
        
    except Exception as e:
        print(f"❌ Error generating metadata: {str(e)}")
        print("Using default metadata...")
        return {
            'description': "A black and white collage image with artistic composition and texture.",
            'tags': ['collage', 'black and white', 'art', 'texture', 'composition']
        }

def update_metadata(image_id, description, tags):
    """Update metadata.json with new image information."""
    metadata_file = METADATA_FILE
    print(f"\nUpdating metadata file: {metadata_file}")
    
    # Load existing metadata
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
            print(f"✓ Loaded existing metadata ({len(metadata)} entries)")
    else:
        metadata = []
        print("Creating new metadata file")
    
    # Add new image metadata
    new_entry = {
        'id': image_id,
        'src': f'{image_id}.jpg',
        'path': f'images/collages/{image_id}.jpg',  # Add path for frontend
        'description': description,
        'tags': tags,
        'dateAdded': datetime.now().isoformat()
    }
    
    metadata.append(new_entry)
    print("\n✓ Added new metadata entry:")
    print(json.dumps(new_entry, indent=2))
    
    # Save updated metadata
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata file with {len(metadata)} total entries")

def cleanup_metadata():
    """Remove metadata entries for images that don't exist in the collages directory."""
    if not os.path.exists(METADATA_FILE):
        print("No metadata file found.")
        return
        
    print("\nCleaning up metadata...")
    try:
        # Load existing metadata
        with open(METADATA_FILE, 'r') as f:
            metadata = json.load(f)
        original_count = len(metadata)
        
        # Filter out entries with missing images
        valid_entries = []
        for entry in metadata:
            image_path = os.path.join(COLLAGES_DIR, entry['src'])
            if os.path.exists(image_path):
                valid_entries.append(entry)
            else:
                print(f"Removing entry for missing image: {entry['id']}")
        
        # Save updated metadata
        with open(METADATA_FILE, 'w') as f:
            json.dump(valid_entries, f, indent=2)
            
        removed_count = original_count - len(valid_entries)
        print(f"Cleanup complete. Removed {removed_count} entries for missing images.")
        
    except Exception as e:
        print(f"Error during metadata cleanup: {e}")

def compute_image_hash(image_path):
    """Compute a perceptual hash of an image for duplicate detection."""
    try:
        with Image.open(image_path) as img:
            # Convert to grayscale and resize to 8x8
            img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
            # Get pixel values
            pixels = list(img.getdata())
            # Compute average pixel value
            avg = sum(pixels) / len(pixels)
            # Create binary hash
            bits = ''.join(['1' if pixel >= avg else '0' for pixel in pixels])
            # Convert binary to hexadecimal
            return hex(int(bits, 2))[2:].zfill(16)
    except Exception as e:
        print(f"Error computing hash for {image_path}: {e}")
        return None

def find_duplicates():
    """Find duplicate images in the collages directory."""
    print("\nChecking for duplicate images...")
    hash_dict = {}
    duplicates = []
    
    # Compute hashes for all images
    for filename in os.listdir(COLLAGES_DIR):
        if not filename.endswith('.jpg'):
            continue
        image_path = os.path.join(COLLAGES_DIR, filename)
        image_hash = compute_image_hash(image_path)
        if image_hash:
            if image_hash in hash_dict:
                duplicates.append((hash_dict[image_hash], filename))
            else:
                hash_dict[image_hash] = filename
    
    return duplicates

def cleanup_duplicates():
    """Remove duplicate images and update metadata."""
    duplicates = find_duplicates()
    if not duplicates:
        print("No duplicates found.")
        return
        
    print(f"\nFound {len(duplicates)} pairs of duplicate images:")
    for original, duplicate in duplicates:
        print(f"- {original} and {duplicate}")
    
    # Load metadata
    with open(METADATA_FILE, 'r') as f:
        metadata = json.load(f)
    
    # Remove entries for duplicate images
    original_count = len(metadata)
    metadata = [entry for entry in metadata if entry['src'] not in [d[1] for d in duplicates]]
    
    # Save updated metadata
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Remove duplicate files
    for _, duplicate in duplicates:
        try:
            os.remove(os.path.join(COLLAGES_DIR, duplicate))
            print(f"Removed duplicate file: {duplicate}")
        except Exception as e:
            print(f"Error removing {duplicate}: {e}")
    
    print(f"\nCleanup complete:")
    print(f"- Removed {original_count - len(metadata)} metadata entries")
    print(f"- Removed {len(duplicates)} duplicate files")

# -------------------- Flask Application --------------------

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path='')
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'index.html')

@app.route('/upload.html')
def upload_page():
    return send_from_directory(ROOT_DIR, 'upload.html')

@app.route('/images/metadata.json')
def serve_metadata():
    """Serve the metadata.json file"""
    return send_from_directory(IMAGES_DIR, 'metadata.json')

@app.route('/images/collages/<path:filename>')
def serve_collage(filename):
    """Serve collage images from the collages directory"""
    return send_from_directory(COLLAGES_DIR, filename)

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images from the images directory"""
    return send_from_directory(IMAGES_DIR, filename)

@app.route('/upload', methods=['POST'])
def upload_images():
    """Handle image upload and processing."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'message': 'No files uploaded'})
    
    files = request.files.getlist('files[]')
    processed_images = []
    errors = []
    
    for file in files:
        if not file.filename:
            continue
            
        temp_path = None
        processed_path = None
        
        try:
            # Save uploaded file
            temp_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
            file.save(temp_path)
            
            # Process image
            processed_path = process_image(temp_path)
            
            # Check for duplicates
            new_hash = compute_image_hash(processed_path)
            if new_hash:
                duplicates = find_duplicates()
                if any(new_hash == compute_image_hash(os.path.join(COLLAGES_DIR, d[0])) for d in duplicates):
                    os.remove(processed_path)
                    errors.append(f"Skipped duplicate image: {file.filename}")
                    continue
            
            # Generate unique ID and move to final location
            image_id = f"img{str(uuid.uuid4())[:8]}"
            final_path = os.path.join(COLLAGES_DIR, f"{image_id}.jpg")
            shutil.move(processed_path, final_path)
            
            # Generate metadata
            metadata = generate_metadata(final_path)
            update_metadata(image_id, metadata['description'], metadata['tags'])
            
            processed_images.append({
                'id': image_id,
                'path': f"images/collages/{image_id}.jpg",
                'description': metadata['description'],
                'tags': metadata['tags']
            })
            
        except Exception as e:
            errors.append(f"Error processing {file.filename}: {str(e)}")
            # Cleanup on error
            for path in [temp_path, processed_path]:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as e:
                        print(f"Error cleaning up {path}: {e}")
    
    if not processed_images and errors:
        return jsonify({
            'success': False,
            'message': 'Failed to process any images',
            'errors': errors
        })
    
    return jsonify({
        'success': True,
        'message': f'Successfully processed {len(processed_images)} images',
        'images': processed_images,
        'errors': errors if errors else None
    })

# Start the server if run directly
if __name__ == '__main__':
    print(f"Starting Assemblage Image Processor server on http://localhost:{IMAGE_PROCESSOR_PORT}")
    print(f"Images will be saved to: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Metadata will be updated at: {os.path.abspath(METADATA_FILE)}")
    cleanup_metadata()  # Clean up metadata before starting server
    cleanup_duplicates()  # Clean up duplicates before starting server
    app.run(host='0.0.0.0', port=IMAGE_PROCESSOR_PORT, debug=True)

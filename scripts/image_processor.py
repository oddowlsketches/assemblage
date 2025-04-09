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

def process_image(image_path, target_size=TARGET_SIZE, quality=JPEG_QUALITY, convert_to_bw=CONVERT_TO_BW):
    """Process an image: resize, convert to B&W if needed, and save as JPEG."""
    with Image.open(image_path) as img:
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize image
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Convert to B&W if needed
        if convert_to_bw:
            img = img.convert('L')
            img = img.convert('RGB')
        
        # Save as JPEG
        output_path = os.path.join(UPLOAD_FOLDER, os.path.basename(image_path))
        img.save(output_path, 'JPEG', quality=quality)
        return output_path

def generate_metadata(image_path):
    """Generate description and tags using OpenAI API."""
    try:
        # Read the image file
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            headers = {'Authorization': f'Bearer {OPENAI_API_KEY}'}
            
            # Call OpenAI API for image analysis
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers=headers,
                json={
                    'model': 'gpt-4-vision-preview',
                    'messages': [
                        {
                            'role': 'user',
                            'content': [
                                {
                                    'type': 'text',
                                    'text': 'Describe this image and suggest 5 relevant tags. Format: Description: [description] Tags: [tag1, tag2, tag3, tag4, tag5]'
                                },
                                {
                                    'type': 'image_url',
                                    'image_url': {
                                        'url': f'data:image/jpeg;base64,{base64.b64encode(img_file.read()).decode()}'
                                    }
                                }
                            ]
                        }
                    ],
                    'max_tokens': 300
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # Parse the response
                description = content.split('Tags:')[0].replace('Description:', '').strip()
                tags = [tag.strip() for tag in content.split('Tags:')[1].strip().split(',')]
                
                return {
                    'description': description,
                    'tags': tags
                }
            else:
                return {
                    'description': 'Image description not available',
                    'tags': ['image']
                }
    except Exception as e:
        print(f"Error generating metadata: {e}")
        return {
            'description': 'Image description not available',
            'tags': ['image']
        }

def update_metadata(image_id, description, tags):
    """Update metadata.json with new image information."""
    metadata_file = METADATA_FILE
    
    # Load existing metadata
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = []
    
    # Add new image metadata
    metadata.append({
        'id': image_id,
        'src': f'{image_id}.jpg',
        'description': description,
        'tags': tags
    })
    
    # Save updated metadata
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

# -------------------- Flask Application --------------------

app = Flask(__name__, static_folder=ROOT_DIR)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'upload.html')

@app.route('/upload', methods=['POST'])
def upload_images():
    """Handle image upload and processing."""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'message': 'No files uploaded'})
    
    files = request.files.getlist('files[]')
    processed_images = []
    
    for file in files:
        if file.filename:
            # Generate unique ID
            image_id = f"img{os.urandom(4).hex()}"
            
            # Save uploaded file temporarily
            temp_path = os.path.join(UPLOAD_FOLDER, f'temp_{image_id}.jpg')
            file.save(temp_path)
            
            try:
                # Process image
                processed_path = process_image(temp_path)
                
                # Generate metadata
                metadata = generate_metadata(processed_path)
                
                # Move the processed image to collages directory
                collage_path = os.path.join(COLLAGES_DIR, f"{image_id}.jpg")
                shutil.copy(processed_path, collage_path)
                print(f"Copied image to {collage_path}")
                
                # Update metadata.json
                update_metadata(image_id, metadata['description'], metadata['tags'])
                
                processed_images.append({
                    'id': image_id,
                    'path': f"images/collages/{image_id}.jpg",
                    'description': metadata['description'],
                    'tags': metadata['tags']
                })
                
            except Exception as e:
                print(f"Error processing image {file.filename}: {e}")
                return jsonify({
                    'success': False,
                    'message': f'Error processing image: {str(e)}'
                })
            
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
    
    return jsonify({
        'success': True,
        'message': f'Successfully processed {len(processed_images)} images',
        'images': processed_images
    })

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images from the images directory"""
    return send_from_directory(UPLOAD_FOLDER, filename)

# Start the server if run directly
if __name__ == '__main__':
    print("Starting Assemblage Image Processor server on http://localhost:5001")
    print(f"Images will be saved to: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Metadata will be updated at: {os.path.abspath(METADATA_FILE)}")
    app.run(host='0.0.0.0', port=IMAGE_PROCESSOR_PORT, debug=True)

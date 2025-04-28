"""
Image Processing Script for Oracle Stack

This script:
1. Processes a folder of images (resizes, standardizes)
2. Generates a placeholder for tags/descriptions to be filled manually
   or with an AI service like GPT Vision
3. Outputs a JSON file with image metadata

Usage:
python process_images.py --input /path/to/images --output /path/to/processed --size 800x600
"""

import os
import sys
import json
import argparse
from PIL import Image
import uuid
from typing import Tuple, List, Dict, Optional
import io

# Supported input formats
SUPPORTED_FORMATS = {
    '.png': 'PNG',
    '.jpg': 'JPEG',
    '.jpeg': 'JPEG',
    '.gif': 'GIF',
    '.bmp': 'BMP',
    '.tiff': 'TIFF',
    '.webp': 'WEBP',
    '.heic': 'HEIC',  # Note: Requires pillow-heif package
    '.avif': 'AVIF'   # Note: Requires pillow-avif-plugin package
}

def generate_id():
    """Generate a unique ID for each image"""
    return f"img{str(uuid.uuid4())[:8]}"

def resize_image(img: Image.Image, max_size: Tuple[int, int]) -> Image.Image:
    """Resize an image while maintaining aspect ratio, only if it exceeds max dimensions"""
    img_width, img_height = img.size
    max_width, max_height = max_size
    
    # Only resize if image is larger than max dimensions
    if img_width <= max_width and img_height <= max_height:
        return img
    
    # Calculate new dimensions preserving aspect ratio
    ratio = min(max_width / img_width, max_height / img_height)
    new_width = int(img_width * ratio)
    new_height = int(img_height * ratio)
    
    # Resize the image
    return img.resize((new_width, new_height), Image.Resampling.LANCZOS)

def optimize_for_web(img: Image.Image, output_format: str, max_size: int = 500_000) -> Tuple[Image.Image, int]:
    """
    Optimize image for web use by iteratively reducing quality until file size is under max_size
    Returns tuple of (optimized image, quality used)
    """
    quality = 90
    while True:
        # Save to temporary buffer to check size
        buffer = io.BytesIO()
        img.save(buffer, format=output_format, quality=quality, optimize=True)
        size = buffer.getbuffer().nbytes
        
        if size <= max_size or quality <= 20:
            break
            
        quality -= 5
    
    return img, quality

def process_images(input_dir: str, output_dir: str, max_size: Tuple[int, int] = (800, 600)):
    """Process all images in the input directory"""
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Create directory for processed images
    processed_dir = os.path.join(output_dir, "processed")
    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)
    
    # Process each image
    metadata: List[Dict] = []
    
    for filename in os.listdir(input_dir):
        # Get file extension and check if supported
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_FORMATS:
            print(f"Skipping unsupported format: {filename}")
            continue
            
        try:
            # Generate a unique ID for this image
            image_id = generate_id()
            
            # Open and process the image
            img_path = os.path.join(input_dir, filename)
            img = Image.open(img_path)
            
            # Convert to RGB if necessary (for PNGs with transparency)
            if img.mode == 'RGBA':
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                # Paste the image on the background
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize the image if needed
            processed_img = resize_image(img, max_size)
            
            # Optimize for web
            optimized_img, quality = optimize_for_web(processed_img, "JPEG")
            
            # Save the processed image
            output_filename = f"{image_id}.jpg"
            output_path = os.path.join(processed_dir, output_filename)
            optimized_img.save(output_path, "JPEG", quality=quality, optimize=True)
            
            # Add metadata
            metadata.append({
                "id": image_id,
                "originalFilename": filename,
                "src": f"images/collages/{output_filename}",
                "tags": [],  # Placeholder for tags to be filled later
                "description": "",  # Placeholder for description
                "originalFormat": ext[1:].upper(),  # Store original format
                "processedFormat": "JPEG",
                "quality": quality,
                "dimensions": {
                    "width": processed_img.size[0],
                    "height": processed_img.size[1]
                },
                "originalDimensions": {
                    "width": img.size[0],
                    "height": img.size[1]
                }
            })
            
            print(f"Processed: {filename} -> {output_filename} (quality: {quality})")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Save metadata to JSON file
    metadata_path = os.path.join(output_dir, "image_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Also create a JavaScript file for the web app
    js_data = f"const imageCollection = {json.dumps(metadata, indent=2)};"
    js_path = os.path.join(output_dir, "data.js")
    with open(js_path, 'w') as f:
        f.write(js_data)
    
    print(f"\nProcessed {len(metadata)} images")
    print(f"Metadata saved to: {metadata_path}")
    print(f"JavaScript data saved to: {js_path}")
    print("\nNext steps:")
    print("1. Add tags and descriptions to the image_metadata.json file")
    print("2. Copy data.js to your project's js directory")
    print("3. Copy processed images to your project's images/collages directory")

def parse_size(size_str: str) -> Tuple[int, int]:
    """Parse size string like '800x600' into a tuple (800, 600)"""
    try:
        width, height = map(int, size_str.lower().split('x'))
        return (width, height)
    except ValueError:
        raise argparse.ArgumentTypeError("Size must be in format WIDTHxHEIGHT, e.g., 800x600")

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="Process images for Oracle Stack")
    parser.add_argument("--input", "-i", required=True, help="Input directory containing images")
    parser.add_argument("--output", "-o", required=True, help="Output directory for processed images and metadata")
    parser.add_argument("--size", "-s", default="800x600", type=parse_size, help="Target size for images (WIDTHxHEIGHT)")
    
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.isdir(args.input):
        print(f"Error: Input directory '{args.input}' does not exist.")
        sys.exit(1)
    
    # Process images
    process_images(args.input, args.output, args.size)

if __name__ == "__main__":
    main()

"""
Image Tagging Script for Oracle Stack using GPT Vision API

This script:
1. Takes a folder of processed images
2. Uses OpenAI's GPT-4 Vision API to generate tags and descriptions
3. Updates the metadata JSON file with the generated tags

Requirements:
- openai Python package: pip install openai
- PIL: pip install pillow

Usage:
python tag_images_with_gpt.py --input /path/to/processed/images --metadata /path/to/image_metadata.json --api-key YOUR_OPENAI_API_KEY
"""

import os
import sys
import json
import argparse
import base64
from PIL import Image
import io
import time
import random
from openai import OpenAI

# Try importing OpenAI
try:
    from openai import OpenAI
except ImportError:
    print("OpenAI package not found. Please install it with: pip install openai")
    print("Then run this script again.")
    sys.exit(1)

def encode_image(image_path):
    """
    Encode an image to base64 for API submission
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def get_tags_with_gpt_vision(image_path, api_key):
    """
    Get tags and description for an image using GPT-4 Vision API
    """
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Encode image
    base64_image = encode_image(image_path)
    
    # Prompt for the API
    prompt = """
    This image is part of a surreal black and white collage art collection for an interactive oracle/fortune-telling web experience.
    
    Please provide:
    1. A concise description (15-30 words) of what's in this image
    2. A list of 5-8 descriptive tags for the image, focusing on themes, emotions, symbols, and aesthetic qualities
    
    Format your response exactly like this:
    DESCRIPTION: [your description here]
    TAGS: [tag1], [tag2], [tag3], [tag4], [tag5], [tag6]
    """
    
    try:
        # Call the OpenAI API using the new format
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        # Parse the response using the new format
        result = response.choices[0].message.content
        
        # Extract description and tags
        description = ""
        tags = []
        
        # Parse the description
        desc_start = result.find("DESCRIPTION:") + len("DESCRIPTION:")
        tags_start = result.find("TAGS:")
        if desc_start >= 0 and tags_start >= 0:
            description = result[desc_start:tags_start].strip()
            
            # Parse tags
            tags_text = result[tags_start + len("TAGS:"):].strip()
            tags = [tag.strip() for tag in tags_text.split(',')]
        
        return {
            "description": description,
            "tags": tags
        }
    
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return {
            "description": "",
            "tags": []
        }

def process_metadata(metadata_path, processed_dir, api_key, delay=1):
    """Process the metadata file and update with tags and descriptions"""
    try:
        # Load the metadata
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Track changes
        updated_count = 0
        
        # Process each image entry
        for i, image_data in enumerate(metadata):
            # Check if this image already has tags
            if image_data.get("tags") and len(image_data["tags"]) > 0 and image_data.get("description"):
                print(f"Skipping {image_data['id']} - already has tags and description")
                continue
            
            # Get the image filename from the src path
            image_filename = os.path.basename(image_data["src"])
            image_path = os.path.join(processed_dir, image_filename)
            
            if not os.path.exists(image_path):
                print(f"Warning: Image file not found: {image_path}")
                continue
            
            print(f"Processing [{i+1}/{len(metadata)}]: {image_filename}")
            
            # Get tags and description from GPT Vision
            result = get_tags_with_gpt_vision(image_path, api_key)
            
            # Update metadata
            if result["description"]:
                image_data["description"] = result["description"]
            
            if result["tags"]:
                image_data["tags"] = result["tags"]
                
            updated_count += 1
            
            # Save updates after each image (in case of interruption)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
                
            # Add delay to avoid rate limiting
            if i < len(metadata) - 1:  # Don't delay after the last image
                sleep_time = delay + random.uniform(0, 1)  # Add some randomness
                print(f"Waiting {sleep_time:.1f} seconds before next image...")
                time.sleep(sleep_time)
        
        # Final save
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
            
        # Also update the JavaScript file
        js_data = f"const imageCollection = {json.dumps(metadata, indent=2)};"
        js_path = os.path.join(os.path.dirname(metadata_path), "data.js")
        with open(js_path, 'w') as f:
            f.write(js_data)
        
        print(f"\nUpdated {updated_count} images with tags and descriptions")
        print(f"Updated metadata saved to: {metadata_path}")
        print(f"Updated JavaScript saved to: {js_path}")
        
    except Exception as e:
        print(f"Error processing metadata: {e}")
        sys.exit(1)

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="Tag images using GPT Vision API")
    parser.add_argument("--input", "-i", required=True, help="Directory containing processed images")
    parser.add_argument("--metadata", "-m", required=True, help="Path to the image_metadata.json file")
    parser.add_argument("--api-key", "-k", required=True, help="OpenAI API key")
    parser.add_argument("--delay", "-d", type=float, default=1.0, help="Delay between API calls in seconds (default: 1.0)")
    
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.isdir(args.input):
        print(f"Error: Input directory '{args.input}' does not exist.")
        sys.exit(1)
        
    # Validate metadata file
    if not os.path.isfile(args.metadata):
        print(f"Error: Metadata file '{args.metadata}' does not exist.")
        sys.exit(1)
    
    # Process metadata and update with tags
    process_metadata(args.metadata, args.input, args.api_key, args.delay)

if __name__ == "__main__":
    main()

"""
Simple Image Tagging Script using GPT Vision API

This script:
1. Takes a folder of images
2. Uses OpenAI's GPT-4 Vision API to generate tags and descriptions
3. Updates the metadata JSON file

Usage:
python simple_tag_images.py --input /path/to/images --metadata /path/to/metadata.json --api-key YOUR_OPENAI_API_KEY
"""

import os
import json
import argparse
import base64
from openai import OpenAI

def encode_image(image_path):
    """Encode image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def analyze_image(client, image_path):
    """Analyze image using GPT Vision"""
    try:
        # Encode image
        base64_image = encode_image(image_path)
        
        print("Trying model: gpt-4-vision")
        # Make API call
        response = client.chat.completions.create(
            model="gpt-4-vision",  # Try new model name
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this image and provide 5 tags. Format: DESCRIPTION: [text] TAGS: [tag1], [tag2], [tag3], [tag4], [tag5]"},
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
        
        # Parse response - updated to match new API format
        result = response.choices[0].message.content
        
        # Extract description and tags
        desc_start = result.find("DESCRIPTION:") + len("DESCRIPTION:")
        tags_start = result.find("TAGS:")
        
        if desc_start >= 0 and tags_start >= 0:
            description = result[desc_start:tags_start].strip()
            tags = [tag.strip() for tag in result[tags_start + len("TAGS:"):].strip().split(',')]
            return description, tags
            
    except Exception as e:
        print(f"Error analyzing image: {e}")
        # If the model name is incorrect, try alternative names
        if "model_not_found" in str(e):
            try:
                print("Trying model: gpt-4o")
                # Try alternative model name
                response = client.chat.completions.create(
                    model="gpt-4o",  # Try alternative model name
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe this image and provide 5 tags. Format: DESCRIPTION: [text] TAGS: [tag1], [tag2], [tag3], [tag4], [tag5]"},
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
                result = response.choices[0].message.content
                
                desc_start = result.find("DESCRIPTION:") + len("DESCRIPTION:")
                tags_start = result.find("TAGS:")
                
                if desc_start >= 0 and tags_start >= 0:
                    description = result[desc_start:tags_start].strip()
                    tags = [tag.strip() for tag in result[tags_start + len("TAGS:"):].strip().split(',')]
                    return description, tags
            except Exception as e2:
                print(f"Error with alternative model: {e2}")
                try:
                    print("Trying model: gpt-4o-vision")
                    # Try second alternative model name
                    response = client.chat.completions.create(
                        model="gpt-4o-vision",  # Try second alternative model name
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Describe this image and provide 5 tags. Format: DESCRIPTION: [text] TAGS: [tag1], [tag2], [tag3], [tag4], [tag5]"},
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
                    result = response.choices[0].message.content
                    
                    desc_start = result.find("DESCRIPTION:") + len("DESCRIPTION:")
                    tags_start = result.find("TAGS:")
                    
                    if desc_start >= 0 and tags_start >= 0:
                        description = result[desc_start:tags_start].strip()
                        tags = [tag.strip() for tag in result[tags_start + len("TAGS:"):].strip().split(',')]
                        return description, tags
                except Exception as e3:
                    print(f"Error with second alternative model: {e3}")
    
    return "", []

def main():
    parser = argparse.ArgumentParser(description="Tag images using GPT Vision")
    parser.add_argument("--input", required=True, help="Directory containing images")
    parser.add_argument("--metadata", required=True, help="Path to metadata.json")
    parser.add_argument("--api-key", required=True, help="OpenAI API key")
    
    args = parser.parse_args()
    
    # Initialize OpenAI client
    client = OpenAI(api_key=args.api_key)
    
    # Load metadata
    with open(args.metadata, 'r') as f:
        metadata = json.load(f)
    
    # Process each image
    for i, image_data in enumerate(metadata):
        # Skip if already tagged
        if image_data.get("tags") and image_data.get("description"):
            print(f"Skipping {image_data['id']} - already tagged")
            continue
        
        # Get image path
        image_path = os.path.join(args.input, os.path.basename(image_data["src"]))
        if not os.path.exists(image_path):
            print(f"Warning: Image not found: {image_path}")
            continue
        
        print(f"Processing [{i+1}/{len(metadata)}]: {image_data['id']}")
        
        # Analyze image
        description, tags = analyze_image(client, image_path)
        
        # Update metadata
        if description:
            image_data["description"] = description
        if tags:
            image_data["tags"] = tags
        
        # Save after each image
        with open(args.metadata, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Added description: {description[:50]}...")
        print(f"Added tags: {', '.join(tags)}")
        print("---")
    
    print("Finished processing all images")

if __name__ == "__main__":
    main() 
# Oracle Stack

An interactive art experience using black and white collage images to generate oracle-style fortunes and readings.

## 📖 Project Overview

Oracle Stack is a browser-based interactive art experience that:

1. Displays random sets of black and white collage images
2. Allows users to arrange these images in different layouts
3. Generates mystical, oracle-style readings based on the selected images
4. Lets users download their readings as images or PDFs

## 🚀 Getting Started

### Prerequisites

- A collection of black and white collage images
- Python 3.6+ (for image processing)
- Optional: OpenAI API key (for automated image tagging)

### Installation and Setup

1. Clone or download this repository to your computer
2. Prepare your images:
   - Place your original collage images in a folder
   - Run the processing script to standardize them (see below)
3. Copy the processed images to the `images/collages` directory
4. Copy the generated `data.js` file to the `js` directory
5. Open `index.html` in a web browser

## 🖼️ Image Processing

The project includes two Python scripts for processing your images:

### Basic Image Processing

This script resizes and standardizes your images and creates a metadata template:

```bash
# Install required packages
pip install pillow

# Run the script
python scripts/process_images.py --input /path/to/your/images --output /path/to/output --size 800x600
```

### Image Tagging with GPT Vision (Optional)

If you have an OpenAI API key, you can use this script to automatically generate tags and descriptions for your images:

```bash
# Install required packages
pip install openai pillow

# Run the script
python scripts/tag_images_with_gpt.py --input /path/to/processed/images --metadata /path/to/image_metadata.json --api-key YOUR_OPENAI_API_KEY
```

## 🔧 Manual Image Tagging

If you prefer to tag your images manually:

1. Open the generated `image_metadata.json` file
2. For each image, add:
   - A description (string)
   - Tags (array of strings)
3. Save the file and update the `data.js` file

Example format:

```json
[
  {
    "id": "img001",
    "originalFilename": "collage1.jpg",
    "src": "images/collages/img001.jpg",
    "tags": ["surreal", "nature", "transformation", "rebirth", "sacred"],
    "description": "A butterfly emerging from a labyrinth of clock mechanisms"
  },
  ...
]
```

## 🎨 Customization

The Oracle Stack can be customized in several ways:

### Visual Styling

- Edit `css/styles.css` to change colors, fonts, and overall appearance
- Edit `css/layouts.css` to modify the image layouts and animations

### Fortune Generation

- Edit the templates and word banks in `js/fortune.js` to customize the fortune texts
- Add new templates for different styles of readings

## 👩‍💻 Development

### Project Structure

```
oracle-stack/
├── index.html
├── css/
│   ├── styles.css
│   └── layouts.css
├── js/
│   ├── app.js        # Main application logic
│   ├── layouts.js    # Layout management
│   ├── fortune.js    # Fortune generation
│   ├── export.js     # Export functionality
│   └── data.js       # Image metadata and tags
├── images/
│   ├── collages/     # Your collage images
│   └── ui/           # UI elements
└── scripts/          # Python scripts for image processing
```

## 📷 Adding Images

To add new images to your collection:

1. Process them using the scripts provided
2. Add them to the `images/collages` directory
3. Update the `data.js` file with their metadata

## 📱 Browser Compatibility

Oracle Stack is compatible with modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📝 License

This project is for personal use. The code structure is provided for your convenience, but the visual design and creative concept are your own.

## 🙏 Acknowledgments

- Created with creative mysticism and code magic
- The Oracle Stack is a digital homage to surrealist collage art and divination traditions

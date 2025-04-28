# Image Processor Configuration

# OpenAI API Key (replace with your actual key or set via environment variable)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

# Server Configuration
IMAGE_PROCESSOR_PORT = 5001

# Image Processing Settings
TARGET_SIZE = (800, 600)  # Target size for processed images
JPEG_QUALITY = 95  # JPEG quality for saved images
CONVERT_TO_BW = True  # Whether to convert images to black and white 
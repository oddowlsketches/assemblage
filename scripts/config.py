import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Assemblage Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Server Configuration
IMAGE_PROCESSOR_PORT = int(os.getenv('IMAGE_PROCESSOR_PORT', '5000'))
MAIN_SERVER_PORT = int(os.getenv('MAIN_SERVER_PORT', '8000'))

# Image Processing Settings
TARGET_SIZE = tuple(map(int, os.getenv('TARGET_SIZE', '800,800').split(',')))
JPEG_QUALITY = int(os.getenv('JPEG_QUALITY', '85'))
CONVERT_TO_BW = os.getenv('CONVERT_TO_BW', 'false').lower() == 'true' 
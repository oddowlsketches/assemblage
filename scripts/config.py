import os
from dotenv import load_dotenv
from pathlib import Path

# Get the root directory (where .env file is located)
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'

# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)

# Assemblage Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Server Configuration
IMAGE_PROCESSOR_PORT = int(os.getenv('IMAGE_PROCESSOR_PORT', '5001'))
MAIN_SERVER_PORT = int(os.getenv('MAIN_SERVER_PORT', '8002'))

# Image Processing Settings
TARGET_SIZE = tuple(map(int, os.getenv('TARGET_SIZE', '800,800').split(',')))
JPEG_QUALITY = int(os.getenv('JPEG_QUALITY', '85'))
CONVERT_TO_BW = os.getenv('CONVERT_TO_BW', 'false').lower() == 'true' 
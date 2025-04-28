import os
from dotenv import load_dotenv
from pathlib import Path

# Get the root directory (where .env file is located)
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'

print(f"Looking for .env file at: {env_path}")
print(f"Does .env file exist? {env_path.exists()}")

# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)

# Print all environment variables
print("\nEnvironment variables:")
for key, value in os.environ.items():
    if 'KEY' in key:  # Only print variables containing 'KEY' for security
        print(f"{key}: {'*' * len(value)}")  # Print asterisks instead of actual value
    else:
        print(f"{key}: {value}")

# Check specific variables
api_key = os.getenv('OPENAI_API_KEY')
print(f"\nOPENAI_API_KEY exists: {api_key is not None}")
if api_key:
    print(f"OPENAI_API_KEY length: {len(api_key)}") 
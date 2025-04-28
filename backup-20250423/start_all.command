#!/bin/bash

# Start both servers for Assemblage
cd "$(dirname "$0")"
echo "Starting Assemblage servers..."

# Check for required Python modules and install if necessary
python3 -c "import PIL" 2>/dev/null || {
    echo "Installing Pillow (PIL) module..."
    pip3 install pillow
}

python3 -c "import flask" 2>/dev/null || {
    echo "Installing Flask module..."
    pip3 install flask flask-cors
}

# Start the main server in the background
echo "Starting main web server on http://localhost:8000"
python3 server.py &
MAIN_PID=$!

# Start the image processor server
echo "Starting image processor server on http://localhost:5001"
python3 scripts/image_processor.py &
IMAGE_PID=$!

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $MAIN_PID $IMAGE_PID 2>/dev/null
    exit 0
}

# Set up trap to clean up processes on exit
trap cleanup INT TERM

# Keep script running
echo "Servers started. Press Ctrl+C to stop."
echo "Main website: http://localhost:8000"
echo "Upload tool: http://localhost:5001"
wait

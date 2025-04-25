#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Function to check if a port is in use
check_port() {
    lsof -i ":$1" >/dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    lsof -ti ":$1" | xargs kill -9 2>/dev/null || true
}

# Kill any existing processes on our ports
echo "Cleaning up any existing processes..."
kill_port 8000
kill_port 5001

# Wait a moment for ports to be released
sleep 2

# Start the main server
echo "Starting main server on http://localhost:8000..."
python3 -m http.server 8000 &
MAIN_SERVER_PID=$!

# Wait a moment for the main server to start
sleep 2

# Check if main server started successfully
if ! check_port 8000; then
    echo "Error: Failed to start main server on port 8000"
    exit 1
fi

# Start the image processor server
echo "Starting image processor on http://localhost:5001..."
python3 scripts/image_processor.py &
IMAGE_PROCESSOR_PID=$!

# Wait a moment for the image processor to start
sleep 2

# Check if image processor started successfully
if ! check_port 5001; then
    echo "Error: Failed to start image processor on port 5001"
    kill $MAIN_SERVER_PID
    exit 1
fi

echo "Both servers started successfully!"
echo "Main server: http://localhost:8000"
echo "Image processor: http://localhost:5001"

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $MAIN_SERVER_PID 2>/dev/null
    kill $IMAGE_PROCESSOR_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Keep script running
wait

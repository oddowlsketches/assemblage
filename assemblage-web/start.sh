#!/bin/bash

# Start the Python server in the background
cd .. && python3 server.py &
PYTHON_PID=$!

# Start the Vite development server
npm run dev

# When the Vite server is stopped, also stop the Python server
kill $PYTHON_PID 
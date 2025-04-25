#!/bin/bash

# Apply LLM Integration Updates
echo "Applying LLM integration updates..."

# Copy updated files
echo "Copying narrativeCompositionManager.js..."
cp narrativeCompositionManager.js.updated narrativeCompositionManager.js

echo "Copying narrative-test.js..."
cp narrative-test.js.updated narrative-test.js

echo "Copying narrative-test.html..."
cp narrative-test.html.updated narrative-test.html

# Make the script executable
chmod +x apply_llm_updates.sh

echo "Updates applied successfully!"
echo "To run the test app, open narrative-test.html in your browser."

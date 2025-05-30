#!/bin/bash

# Install missing dependencies for the UI implementation
cd /Users/emilyschwartzman/assemblage-app/assemblage-web

echo "Installing missing dependencies for user collections UI..."

# Install production dependencies
npm install --save \
  react-dropzone \
  browser-image-compression \
  @tanstack/react-query \
  lucide-react \
  tailwind-merge

# Install dev dependencies for testing
npm install --save-dev \
  @testing-library/user-event \
  jsdom \
  @vitest/ui

echo "Dependencies installed successfully!"

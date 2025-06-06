#!/bin/bash

# Install recharts for the Analytics page
echo "Installing recharts for template analytics..."

cd /Users/emilyschwartzman/assemblage-app/assemblage-web

# Install recharts
npm install recharts

echo "Recharts installed successfully!"
echo ""
echo "You can now use the full Recharts implementation in Analytics.jsx"
echo "The current implementation uses a CSS-based fallback that works without recharts."

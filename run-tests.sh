#!/bin/bash

# Run the tests and capture output
echo "Running Vitest tests for image utilities..."
echo ""

cd /Users/emilyschwartzman/assemblage-app
npm run test:run -- supabase/lib/__tests__/imageUtils.test.ts

echo ""
echo "Test run complete!"

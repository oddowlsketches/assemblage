#!/bin/bash

# Script to apply the rotation column migration
# This script can be used to apply the migration if Supabase CLI is not available

echo "Adding rotation column to images table..."

# If you have direct database access, run this SQL:
echo "SQL to run manually:"
echo "ALTER TABLE images ADD COLUMN rotation INTEGER DEFAULT 0;"
echo "ALTER TABLE images ADD CONSTRAINT valid_rotation_values CHECK (rotation IN (0, 90, 180, 270));"
echo "CREATE INDEX idx_images_rotation ON images(rotation);"

echo ""
echo "Or if using Supabase CLI:"
echo "supabase db push"

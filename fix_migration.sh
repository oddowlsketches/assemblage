#!/bin/bash

# Reset the failed migration
echo "Resetting failed migration..."
supabase migration repair --status reverted 20250529025600

# Then try pushing again
echo "Pushing migrations..."
supabase db push

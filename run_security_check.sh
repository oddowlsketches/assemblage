#!/bin/bash

# Quick command to run the security pre-check
# This script uses the Supabase CLI which is the recommended approach

# Load environment variables
source .env

# Extract project reference from Supabase URL
DB_HOST="${SUPABASE_URL#https://}"
DB_HOST="${DB_HOST%.supabase.co}"
PROJECT_REF="$DB_HOST"

echo "🔍 Running Security Pre-Check for project: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing it now..."
    echo ""
    
    # Check OS and provide installation instructions
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "To install Supabase CLI on macOS, run:"
        echo "  brew install supabase/tap/supabase"
    else
        echo "To install Supabase CLI, visit:"
        echo "  https://supabase.com/docs/guides/cli"
    fi
    
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: supabase/config.toml not found."
    echo "Please run this script from the assemblage-app directory."
    exit 1
fi

# Link the project if not already linked
echo "🔗 Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF" 2>/dev/null || true

# Run the security pre-check using Supabase CLI
echo "📊 Checking security issues..."
echo ""

supabase db execute -f supabase/security_pre_check.sql

echo ""
echo "✅ Pre-check complete!"
echo ""
echo "Next steps:"
echo "1. Review the security issues found above"
echo "2. Run './fix_security.sh' and choose option 2 to create a backup"
echo "3. Run './fix_security.sh' and choose option 3 to apply security fixes"
echo "4. Enable 'Leaked Password Protection' in your Supabase dashboard"

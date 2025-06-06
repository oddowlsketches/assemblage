#!/bin/bash

# Improved Supabase Security Fix Script with better error handling

# Load environment variables
source .env

# Extract project reference from Supabase URL
DB_HOST="${SUPABASE_URL#https://}"
DB_HOST="${DB_HOST%.supabase.co}"
PROJECT_REF="$DB_HOST"

echo "🔐 Assemblage Security Fix Script"
echo "================================"
echo "Project: $PROJECT_REF"
echo ""

# Function to check if Supabase CLI is properly set up
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI not found. Please install it first:"
        echo "   brew install supabase/tap/supabase"
        return 1
    fi
    
    # Check if project is linked
    if ! supabase status 2>/dev/null | grep -q "$PROJECT_REF"; then
        echo "🔗 Linking to Supabase project..."
        supabase link --project-ref "$PROJECT_REF"
    fi
    
    return 0
}

# Main menu
echo "What would you like to do?"
echo "1) Run security pre-check (see current issues)"
echo "2) Create database backup (via Dashboard)"
echo "3) Apply security fixes"
echo "4) Run post-fix verification"
echo "5) Emergency rollback (if needed)"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Running Security Pre-Check..."
        echo ""
        
        if check_supabase_cli; then
            # Try using Supabase CLI first
            supabase db execute -f supabase/security_pre_check.sql
        else
            echo ""
            echo "Alternative: Use the Supabase Dashboard SQL Editor"
            echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/sql"
            echo "2. Copy and paste the contents of supabase/security_pre_check.sql"
            echo "3. Click 'Run'"
        fi
        ;;
        
    2)
        echo ""
        echo "💾 Creating Database Backup..."
        echo ""
        echo "Due to connection issues, please create a backup using one of these methods:"
        echo ""
        echo "Option 1: Supabase Dashboard (Recommended)"
        echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/settings/general"
        echo "2. Scroll to 'Database Backups'"
        echo "3. Click 'Create a backup'"
        echo ""
        echo "Option 2: SQL Editor Export"
        echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/sql"
        echo "2. Run: SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
        echo "3. Export each table's data manually"
        echo ""
        echo "Option 3: Try Supabase CLI (after linking)"
        echo "Run these commands:"
        echo "  supabase link --project-ref $PROJECT_REF"
        echo "  supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql"
        echo ""
        read -p "Press Enter when backup is complete..."
        ;;
        
    3)
        echo ""
        echo "🔧 Applying Security Fixes..."
        echo "⚠️  This will modify your database. Make sure you have a backup!"
        read -p "Continue? (y/n): " confirm
        
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            echo ""
            echo "Choose method to apply fixes:"
            echo "1) Supabase CLI (if properly linked)"
            echo "2) Dashboard SQL Editor"
            read -p "Enter choice (1-2): " method
            
            if [[ $method == "1" ]]; then
                if check_supabase_cli; then
                    cd supabase
                    supabase db push
                    cd ..
                    echo "✅ Security fixes applied!"
                fi
            else
                echo ""
                echo "To apply via Dashboard:"
                echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/sql"
                echo "2. Open file: supabase/migrations/20250606000000_fix_security_issues.sql"
                echo "3. Copy ALL contents and paste into SQL Editor"
                echo "4. Click 'Run'"
                echo ""
                echo "File location: $(pwd)/supabase/migrations/20250606000000_fix_security_issues.sql"
            fi
            
            echo ""
            echo "📌 IMPORTANT: After applying SQL fixes:"
            echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/auth/providers"
            echo "2. Enable 'Leaked Password Protection'"
            echo "3. Save the changes"
        else
            echo "❌ Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "✓ Running Post-Fix Verification..."
        echo ""
        
        if check_supabase_cli; then
            supabase db execute -f supabase/security_pre_check.sql
        else
            echo "Run the pre-check SQL in the Dashboard to verify fixes."
        fi
        ;;
        
    5)
        echo ""
        echo "⚠️  Emergency Rollback"
        echo "This will undo the security fixes and reopen vulnerabilities."
        echo "Only use this if the fixes caused critical issues."
        read -p "Are you sure you want to rollback? (type 'ROLLBACK' to confirm): " confirm
        
        if [[ $confirm == "ROLLBACK" ]]; then
            echo ""
            echo "To rollback via Dashboard:"
            echo "1. Go to: ${SUPABASE_URL}/project/${PROJECT_REF}/sql"
            echo "2. Open file: supabase/migrations/20250606000000_rollback_security_fixes.sql.rollback"
            echo "3. Copy contents and paste into SQL Editor"
            echo "4. Click 'Run'"
            echo ""
            echo "File: $(pwd)/supabase/migrations/20250606000000_rollback_security_fixes.sql.rollback"
        else
            echo "❌ Rollback cancelled."
        fi
        ;;
        
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "Done! Run this script again if you need to perform other actions."

#!/bin/bash

# Supabase Security Check and Fix Script
# This script helps you safely apply security fixes to your Supabase database

# Load environment variables
source .env

# Construct the database URL
DB_HOST="${SUPABASE_URL#https://}"
DB_HOST="${DB_HOST%.supabase.co}"
PROJECT_REF="$DB_HOST"

echo "🔐 Assemblage Security Fix Script"
echo "================================"
echo "Project: $PROJECT_REF"
echo ""

# Function to run SQL commands
run_sql() {
    local sql_file=$1
    local description=$2
    
    echo "📋 $description"
    echo "Running: $sql_file"
    
    # Using Supabase CLI
    if command -v supabase &> /dev/null; then
        supabase db push --db-url "postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.${PROJECT_REF}.supabase.co:5432/postgres" < "$sql_file"
    else
        echo "❌ Supabase CLI not found. Please install it first:"
        echo "   brew install supabase/tap/supabase"
        exit 1
    fi
}

# Main menu
echo "What would you like to do?"
echo "1) Run security pre-check (see current issues)"
echo "2) Create database backup"
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
        echo "This will show all current security issues."
        echo ""
        
        # Create a temporary file with the connection info
        cat > /tmp/run_precheck.sh << EOF
#!/bin/bash
export PGPASSWORD="${SUPABASE_SERVICE_KEY}"
psql "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" -f supabase/security_pre_check.sql
EOF
        chmod +x /tmp/run_precheck.sh
        /tmp/run_precheck.sh
        rm /tmp/run_precheck.sh
        ;;
        
    2)
        echo ""
        echo "💾 Creating Database Backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_file="backup_${timestamp}.sql"
        
        if command -v supabase &> /dev/null; then
            supabase db dump --db-url "postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.${PROJECT_REF}.supabase.co:5432/postgres" -f "$backup_file"
            echo "✅ Backup saved to: $backup_file"
        else
            echo "❌ Supabase CLI not found. Using pg_dump instead..."
            export PGPASSWORD="${SUPABASE_SERVICE_KEY}"
            pg_dump "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" > "$backup_file"
            echo "✅ Backup saved to: $backup_file"
        fi
        ;;
        
    3)
        echo ""
        echo "🔧 Applying Security Fixes..."
        echo "⚠️  This will modify your database. Make sure you have a backup!"
        read -p "Continue? (y/n): " confirm
        
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            # Apply the migration using Supabase CLI
            if command -v supabase &> /dev/null; then
                cd supabase
                supabase db push
                cd ..
                echo "✅ Security fixes applied!"
                echo ""
                echo "📌 IMPORTANT: Now go to your Supabase Dashboard and:"
                echo "   1. Navigate to Authentication → Providers"
                echo "   2. Enable 'Leaked Password Protection'"
                echo "   3. Save the changes"
                echo ""
                echo "Dashboard URL: ${SUPABASE_URL}/project/${PROJECT_REF}/auth/providers"
            else
                echo "❌ Supabase CLI not found. Please install it first."
            fi
        else
            echo "❌ Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "✓ Running Post-Fix Verification..."
        echo "This will check if all security issues have been resolved."
        echo ""
        
        # Run the pre-check again to see if issues are fixed
        export PGPASSWORD="${SUPABASE_SERVICE_KEY}"
        psql "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" -f supabase/security_pre_check.sql
        ;;
        
    5)
        echo ""
        echo "⚠️  Emergency Rollback"
        echo "This will undo the security fixes and reopen vulnerabilities."
        echo "Only use this if the fixes caused critical issues."
        read -p "Are you sure you want to rollback? (type 'ROLLBACK' to confirm): " confirm
        
        if [[ $confirm == "ROLLBACK" ]]; then
            export PGPASSWORD="${SUPABASE_SERVICE_KEY}"
            psql "postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres" -f supabase/migrations/20250606000000_rollback_security_fixes.sql.rollback
            echo "✅ Rollback completed. Please fix any issues and reapply security fixes soon."
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

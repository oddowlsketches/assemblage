-- =====================================================
-- SECURITY AUDIT FIXES MIGRATION
-- =====================================================
-- This migration addresses:
-- 1. Enable RLS on public.images table
-- 2. Consolidate duplicate permissive policies
-- 3. Optimize auth.uid() calls to avoid re-evaluation
-- 4. Clean up obsolete policies
-- =====================================================

-- =====================================================
-- SECTION 1: ENABLE RLS ON PUBLIC.IMAGES
-- =====================================================
-- Enable Row Level Security on images table
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 2: DROP ALL EXISTING POLICIES
-- =====================================================
-- First, we'll drop all existing policies to start fresh
-- This prevents conflicts and ensures clean implementation

-- Drop policies on images table if they exist
DROP POLICY IF EXISTS "Users can view own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert own images" ON public.images;
DROP POLICY IF EXISTS "Users can update own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own images" ON public.images;
DROP POLICY IF EXISTS "Service role has full access" ON public.images;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.images;
DROP POLICY IF EXISTS "Users can manage their own images" ON public.images;
DROP POLICY IF EXISTS "Allow service role full access" ON public.images;

-- Drop policies on saved_collages table if they exist
DROP POLICY IF EXISTS "Users can view own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can insert own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can update own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can delete own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Service role has full access" ON public.saved_collages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can manage their own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Allow service role full access" ON public.saved_collages;

-- Drop policies on user_collections table if they exist
DROP POLICY IF EXISTS "Users can view own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can update own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Service role has full access" ON public.user_collections;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.user_collections;
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Allow service role full access" ON public.user_collections;

-- Drop policies on external_tokens table if they exist
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Service role has full access" ON public.external_tokens;
DROP POLICY IF EXISTS "Allow service role full access" ON public.external_tokens;

-- =====================================================
-- SECTION 3: CREATE OPTIMIZED POLICIES FOR IMAGES TABLE
-- =====================================================
-- Create one policy per action with optimized auth check

-- SELECT policy: Users can view their own images or if service_role
CREATE POLICY "images_select_policy" ON public.images
    FOR SELECT
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- INSERT policy: Users can insert their own images or if service_role
CREATE POLICY "images_insert_policy" ON public.images
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- UPDATE policy: Users can update their own images or if service_role
CREATE POLICY "images_update_policy" ON public.images
    FOR UPDATE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- DELETE policy: Users can delete their own images or if service_role
CREATE POLICY "images_delete_policy" ON public.images
    FOR DELETE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- =====================================================
-- SECTION 4: CREATE OPTIMIZED POLICIES FOR SAVED_COLLAGES TABLE
-- =====================================================

-- SELECT policy: Users can view their own collages or if service_role
CREATE POLICY "saved_collages_select_policy" ON public.saved_collages
    FOR SELECT
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- INSERT policy: Users can insert their own collages or if service_role
CREATE POLICY "saved_collages_insert_policy" ON public.saved_collages
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- UPDATE policy: Users can update their own collages or if service_role
CREATE POLICY "saved_collages_update_policy" ON public.saved_collages
    FOR UPDATE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- DELETE policy: Users can delete their own collages or if service_role
CREATE POLICY "saved_collages_delete_policy" ON public.saved_collages
    FOR DELETE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- =====================================================
-- SECTION 5: CREATE OPTIMIZED POLICIES FOR USER_COLLECTIONS TABLE
-- =====================================================

-- SELECT policy: Users can view their own collections or if service_role
CREATE POLICY "user_collections_select_policy" ON public.user_collections
    FOR SELECT
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- INSERT policy: Users can insert their own collections or if service_role
CREATE POLICY "user_collections_insert_policy" ON public.user_collections
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- UPDATE policy: Users can update their own collections or if service_role
CREATE POLICY "user_collections_update_policy" ON public.user_collections
    FOR UPDATE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- DELETE policy: Users can delete their own collections or if service_role
CREATE POLICY "user_collections_delete_policy" ON public.user_collections
    FOR DELETE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- =====================================================
-- SECTION 6: CREATE OPTIMIZED POLICIES FOR EXTERNAL_TOKENS TABLE
-- =====================================================

-- SELECT policy: Users can view their own tokens or if service_role
CREATE POLICY "external_tokens_select_policy" ON public.external_tokens
    FOR SELECT
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- INSERT policy: Users can insert their own tokens or if service_role
CREATE POLICY "external_tokens_insert_policy" ON public.external_tokens
    FOR INSERT
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- UPDATE policy: Users can update their own tokens or if service_role
CREATE POLICY "external_tokens_update_policy" ON public.external_tokens
    FOR UPDATE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- DELETE policy: Users can delete their own tokens or if service_role
CREATE POLICY "external_tokens_delete_policy" ON public.external_tokens
    FOR DELETE
    USING (
        user_id = (SELECT auth.uid()) 
        OR (SELECT auth.jwt() ->> 'role') = 'service_role'
    );

-- =====================================================
-- SECTION 7: VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================
-- Ensure RLS is enabled on all tables (in case they weren't already)
ALTER TABLE public.saved_collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 8: PERFORMANCE OPTIMIZATION COMMENTS
-- =====================================================
-- The following optimizations have been applied:
-- 1. Used (SELECT auth.uid()) instead of auth.uid() to avoid re-evaluation per row
-- 2. Used (SELECT auth.jwt() ->> 'role') for service_role check
-- 3. Created one policy per action (SELECT, INSERT, UPDATE, DELETE) per table
-- 4. Removed all duplicate and overlapping policies
-- 5. Consistent naming convention: tablename_action_policy

-- =====================================================
-- SECTION 9: VERIFICATION QUERIES (commented out)
-- =====================================================
-- Run these queries after migration to verify policies are correctly set:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('images', 'saved_collages', 'user_collections', 'external_tokens')
-- ORDER BY tablename, policyname;

-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('images', 'saved_collages', 'user_collections', 'external_tokens');

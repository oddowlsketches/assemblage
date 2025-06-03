-- =====================================================
-- SECURITY AUDIT CLEANUP - REMOVE OLD POLICIES
-- =====================================================
-- The previous migration added new policies but the old ones
-- weren't dropped. This cleanup migration removes all the
-- old duplicate policies, leaving only the optimized ones.
-- =====================================================

-- =====================================================
-- SECTION 1: DROP OLD POLICIES ON EXTERNAL_TOKENS
-- =====================================================
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.external_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.external_tokens;

-- =====================================================
-- SECTION 2: DROP OLD POLICIES ON IMAGES
-- =====================================================
DROP POLICY IF EXISTS "Allow public inserts into images" ON public.images;
DROP POLICY IF EXISTS "Anon can delete images" ON public.images;
DROP POLICY IF EXISTS "Anon can update images" ON public.images;
DROP POLICY IF EXISTS "CMS images are viewable by anyone" ON public.images;
DROP POLICY IF EXISTS "Public can select images" ON public.images;
DROP POLICY IF EXISTS "Service role has full access to images" ON public.images;
DROP POLICY IF EXISTS "Users delete own images" ON public.images;
DROP POLICY IF EXISTS "Users insert own images" ON public.images;
DROP POLICY IF EXISTS "Users update own images" ON public.images;
DROP POLICY IF EXISTS "View images based on provider" ON public.images;

-- =====================================================
-- SECTION 3: DROP OLD POLICIES ON SAVED_COLLAGES
-- =====================================================
DROP POLICY IF EXISTS "Users can delete their own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can delete their own saved collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can insert their own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can insert their own saved collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can update their own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can update their own saved collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can view their own collages" ON public.saved_collages;
DROP POLICY IF EXISTS "Users can view their own saved collages" ON public.saved_collages;

-- =====================================================
-- SECTION 4: DROP OLD POLICIES ON USER_COLLECTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.user_collections;
DROP POLICY IF EXISTS "Users can view their own collections" ON public.user_collections;

-- =====================================================
-- SECTION 5: VERIFY ONLY OPTIMIZED POLICIES REMAIN
-- =====================================================
-- After running this cleanup, you should have exactly 4 policies per table:
-- - tablename_select_policy
-- - tablename_insert_policy
-- - tablename_update_policy
-- - tablename_delete_policy
--
-- Run this query to verify:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('images', 'saved_collages', 'user_collections', 'external_tokens')
-- ORDER BY tablename, policyname;

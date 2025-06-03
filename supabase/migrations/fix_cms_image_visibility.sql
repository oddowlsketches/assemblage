-- Updated RLS policy for images table to grant admin full access and ensure public access

-- Drop existing policy first to redefine it
DROP POLICY IF EXISTS "images_select_policy" ON "public"."images";

-- Create the new, more precise select policy for images
CREATE POLICY "images_select_policy"
ON "public"."images"
FOR SELECT
USING ( -- Note: TO authenticated/public will be handled by Supabase UI or separate grants
    -- Case 1: Admin user (ecschwar@gmail.com) can see ALL images.
    ((auth.jwt() ->> 'email'::text) = 'ecschwar@gmail.com'::text)

    -- Case 2: Service role can see ALL images.
    OR ((auth.role() = 'service_role'::text))

    -- Case 3: For any authenticated or anonymous user,
    -- allow if the image is part of a public 'image_collection'.
    OR (
        images.collection_id IS NOT NULL AND
        EXISTS (
            SELECT 1
            FROM public.image_collections ic
            WHERE ic.id = images.collection_id AND ic.is_public = true
        )
    )

    -- Case 4: For authenticated users,
    -- allow if the image is part of one of THEIR 'user_collections'.
    OR (
        auth.uid() IS NOT NULL AND 
        images.user_collection_id IS NOT NULL AND
        EXISTS (
            SELECT 1
            FROM public.user_collections uc
            WHERE uc.id = images.user_collection_id AND uc.user_id = (auth.uid())
        )
    )
    
    -- Case 5: For authenticated users,
    -- allow if the image is directly linked to their user_id AND
    -- it's NOT part of any public image_collection (and not part of a user_collection already covered by Case 4).
    OR (
        auth.uid() IS NOT NULL AND 
        images.user_id = (auth.uid()) AND
        images.collection_id IS NULL AND
        images.user_collection_id IS NULL 
    )
);

-- Reminder: After applying this SELECT policy, manually verify and correct data if needed.
-- Specifically, the 110 images that were updated by the CMS to have 
-- collection_id = '00000000-0000-0000-0000-000000000001' (default public) and provider = 'cms'.
-- If these were personal images, their collection_id should be set back to NULL 
-- or to their correct user_collection_id, and their provider perhaps to 'upload'.


-- Note: Review and adjust your INSERT, UPDATE, DELETE policies for the images table
-- to ensure your admin account (ecschwar@gmail.com) also has the necessary permissions
-- if the CMS tool needs to perform these operations on all images.
-- Example for UPDATE (apply similar logic for INSERT and DELETE if needed):

-- DROP POLICY IF EXISTS "images_update_policy" ON "public"."images";
-- CREATE POLICY "images_update_policy"
-- ON "public"."images"
-- FOR UPDATE
-- TO authenticated
-- USING (
--     (images.user_id = (auth.uid())) OR
--     ((auth.jwt() ->> 'email'::text) = 'ecschwar@gmail.com'::text) OR
--     ((auth.role() = 'service_role'::text))
-- )
-- WITH CHECK (
--     (images.user_id = (auth.uid())) OR
--     ((auth.jwt() ->> 'email'::text) = 'ecschwar@gmail.com'::text) OR
--     ((auth.role() = 'service_role'::text))
-- );


-- Regarding image_collections policies, you have several. 
-- This is a more standard way to allow public read and admin full access:

-- Drop potentially redundant/overly permissive policies first
-- DROP POLICY IF EXISTS "Authenticated users can view all collections" ON "public"."image_collections";
-- DROP POLICY IF EXISTS "Public can view image collections" ON "public"."image_collections";
-- DROP POLICY IF EXISTS "Public collections are viewable by anyone" ON "public"."image_collections";

-- Policy for anyone to SELECT public image_collections
-- CREATE POLICY "Public image_collections readable" 
-- ON "public"."image_collections" 
-- FOR SELECT 
-- TO public -- Or 'authenticated' if only signed-in users can see public lists
-- USING (is_public = true);

-- Policy for admin (your email) to SELECT all image_collections
-- CREATE POLICY "Admin select all image_collections"
-- ON "public"."image_collections"
-- FOR SELECT
-- TO authenticated -- Or your specific admin role if you have one
-- USING (((auth.jwt() ->> 'email'::text) = 'ecschwar@gmail.com'::text));

-- Ensure your admin also has INSERT/UPDATE/DELETE on image_collections if needed by CMS
-- e.g., for "Service role can manage collections", ensure 'ecschwar@gmail.com' is covered or add a specific admin policy. 
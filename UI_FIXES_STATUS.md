# Issues Fixed and Remaining

## ✅ Fixed Issues:

1. **Sign In/Sign Up Screen**
   - Removed duplicate "Create Account" button
   - Added dynamic header that changes between "Sign in" and "Create account" based on state
   - Note: The bottom "Create Account" link is provided by Supabase Auth UI component

2. **Sign In Button Position**
   - Moved Sign In button to far right in header
   - Added "to save collages" helper text below it

3. **Gallery Signed Out State**
   - Gallery already shows empty state when not signed in

4. **Upload Modal Signed Out**
   - Added sign in/sign up prompt when not authenticated
   - Shows buttons to trigger auth flow

5. **Upload Modal UI**
   - Removed redundant "Choose where to upload" header
   - Auto-selects first collection 
   - Shows maximum upload limit (30 images)
   - Simplified collection selector header

6. **Gallery UI Colors**
   - Changed Gallery to use white background with black/gray text
   - Removed dynamic color theming from Gallery view

## ⚠️ Issues Needing Investigation:

1. **Gallery Opening on First Sign In**
   - This appears to be happening in CollectionDrawer, not from the auth flow
   - Need to trace where the navigation is triggered

2. **Default Collection Not Loading**
   - The default "Emily's Treasures" collection should be selected by default
   - Images may not be loading due to API/database issues

3. **Dropdown Selection Display**
   - SourceSelector component needs to be checked for why it's not showing the active collection name

4. **Upload 400 Error**
   - The error suggests the `archived` column might not exist in the database
   - Migration exists but may not have been run
   - Need to check Supabase dashboard

## 📝 Recommended Next Steps:

1. **Run the archived column migration** in Supabase:
   ```sql
   ALTER TABLE public.images 
   ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
   
   CREATE INDEX IF NOT EXISTS idx_images_archived ON public.images(archived);
   ```

2. **Debug the default collection loading** - check if the API is returning the correct data

3. **Fix the SourceSelector dropdown** to properly display the selected collection name

4. **Trace CollectionDrawer navigation** to prevent it from opening on sign in

Would you like me to continue fixing these remaining issues?

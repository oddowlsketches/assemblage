# Collection Creation Bug Fix

## Issue
When creating a new collection, the app was trying to insert a record into the `image_collections` table with a `user_id` column that doesn't exist in the database schema. This caused the error:

```
Failed to create collection in both tables: Could not find the 'user_id' column of 'image_collections' in the schema cache
```

## Root Cause
The code was incorrectly trying to create entries in both `user_collections` and `image_collections` tables. However:
- `user_collections` table is for user-created collections
- `image_collections` table is for admin/CMS-managed collections only
- The `image_collections` table doesn't have a `user_id` column

## Solution
Removed the code that attempts to create entries in the `image_collections` table when users create new collections. User collections should only be created in the `user_collections` table.

## Files Modified
1. `/src/components/CollectionDrawer.jsx` - Removed code that creates image_collections entry
2. `/src/App.jsx` - Removed code that creates image_collections entry for new users

## What Changed
- `createCollection` function now only creates entries in `user_collections`
- Default collection creation for new users only creates entries in `user_collections`
- Both functions now work correctly without throwing database errors

## Testing
1. Sign in as a user
2. Go to "My Collections"
3. Click "New" button
4. Enter a collection name and click "Create"
5. Collection should be created successfully without errors
6. You should be able to upload images to the new collection

The fix ensures user collections are properly separated from admin collections, maintaining the intended database schema structure.

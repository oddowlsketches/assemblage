# Database Setup Instructions

## Creating the list_images Function

To fix the issue with loading images from both default (CMS) and user collections, you need to create a PostgreSQL function in your Supabase database.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/list_images_function.sql`
4. Click "Run" to execute the SQL

### What this function does:

- Handles the OR logic between default collection (stored in `image_collections`) and user collections (stored in `user_collections`)
- For the default collection ID (`00000000-0000-0000-0000-000000000001`), it returns all CMS images
- For user collection IDs, it returns only images that belong to the current authenticated user
- Allows anonymous users to access the default collection
- Returns an empty set if an unauthenticated user tries to access a user collection

### Testing:

After creating the function, you can test it in the SQL editor:

```sql
-- Test with default collection
SELECT * FROM list_images('00000000-0000-0000-0000-000000000001');

-- Test with a user collection ID (replace with actual UUID)
SELECT * FROM list_images('635c21d3-93e0-4504-8e87-53c785f58211');
```

### Important Notes:

- The default collection ID is hardcoded in the function. If this changes, you'll need to update the function.
- The function uses `SECURITY DEFINER` which means it runs with the privileges of the function creator, allowing it to access the images table even if RLS policies would normally prevent it.
- Make sure your `images` table has proper indexes on `collection_id`, `user_collection_id`, and `user_id` for performance.
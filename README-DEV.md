# Assemblage Developer Documentation

## Table of Contents
- [Dropbox Integration Setup](#dropbox-integration-setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Dropbox Integration Setup

### 1. Create a Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose:
   - **API**: Scoped access
   - **Access**: App folder (recommended) or Full Dropbox
   - **Name**: Your app name (e.g., "Assemblage Dev")
4. After creation, go to the app's settings page

### 2. Configure OAuth 2

1. In your app's settings, find the **OAuth 2** section
2. Add redirect URIs:
   - For local development: `http://localhost:8888/.netlify/functions/dropbox-auth-callback`
   - For production: `https://your-domain.com/.netlify/functions/dropbox-auth-callback`
3. Note down:
   - **App key** (client ID)
   - **App secret** (client secret)

### 3. Set Permissions

In the **Permissions** tab, enable:
- `files.content.read` - Read file content
- `files.metadata.read` - Read file metadata
- `account_info.read` - Read account information

### 4. Environment Variables

Add to your `.env` file:

```bash
# Dropbox OAuth
DROPBOX_APP_KEY=your_app_key_here
DROPBOX_APP_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:8888/.netlify/functions/dropbox-auth-callback

# Supabase (for Netlify functions)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

For Supabase Edge Functions, set environment variables:
```bash
supabase secrets set DROPBOX_APP_KEY=your_app_key_here
supabase secrets set DROPBOX_APP_SECRET=your_app_secret_here
```

### 5. Database Setup

The required tables are created by migration `20250529020932_add_user_collections_and_dropbox.sql`:

- `external_tokens` - Stores encrypted OAuth tokens
- `user_collections` - User-specific image collections
- Updated `images` table with `provider`, `remote_id`, and `user_id` columns

### 6. Testing the Integration

1. Start the Netlify dev server:
   ```bash
   netlify dev
   ```

2. Navigate to `/auth/dropbox/start` to initiate OAuth flow

3. After authorization, check the `external_tokens` table for saved credentials

4. Test the list_dropbox function:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/list_dropbox \
     -H "Authorization: Bearer YOUR_USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"path": "/Apps/Assemblage"}'
   ```

## Environment Variables

### Required for Dropbox Integration

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `DROPBOX_APP_KEY` | Dropbox app client ID | `.env`, Supabase secrets |
| `DROPBOX_APP_SECRET` | Dropbox app client secret | `.env`, Supabase secrets |
| `DROPBOX_REDIRECT_URI` | OAuth callback URL | `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `.env` |
| `VITE_SUPABASE_URL` | Supabase project URL | `.env` |

### Security Notes

- **TODO**: Implement proper encryption for tokens in `external_tokens` table
- Never commit `.env` files to version control
- Use different Dropbox apps for development and production
- Rotate secrets regularly

## Testing

### Unit Tests

Run the Dropbox integration tests:
```bash
cd supabase/functions/list_dropbox
deno test --allow-net --allow-env list_dropbox.test.ts
```

### Integration Tests

1. Mock Dropbox API responses for testing
2. Use Supabase local development for database tests
3. Test error cases:
   - Expired tokens
   - Invalid tokens
   - Rate limiting
   - Network errors

### Manual Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens are saved to database
- [ ] Token refresh works when expired
- [ ] Images are discovered and inserted
- [ ] Duplicate prevention works
- [ ] Images are queued for processing
- [ ] Error handling for missing Dropbox connection
- [ ] Proper user isolation (RLS policies)

## Architecture Notes

### OAuth Flow
1. User clicks "Connect Dropbox" → `dropbox-auth-start` function
2. Redirected to Dropbox for authorization
3. Dropbox redirects to `dropbox-auth-callback` function
4. Callback exchanges code for tokens and saves to database

### Image Import Flow
1. User triggers `list_dropbox` edge function
2. Function fetches file list from Dropbox API
3. Filters for image files only
4. Checks for existing images to prevent duplicates
5. Inserts new images with `metadata_status='pending'`
6. Queues images for `process_image` function
7. Returns summary of import results

### Security Considerations
- All functions verify JWT authentication
- RLS policies ensure users only see their own data
- Tokens should be encrypted at rest (TODO)
- Advisory locks prevent race conditions

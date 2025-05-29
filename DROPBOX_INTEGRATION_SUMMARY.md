# Dropbox Integration Implementation Summary

## Files Created/Modified

### 1. **Netlify Functions** (OAuth Flow)

#### `/netlify/functions/dropbox-auth-start.ts`
- Initiates OAuth flow by redirecting to Dropbox
- Requests scopes: `files.content.read`, `files.metadata.read`, `account_info.read`
- Uses `token_access_type=offline` for refresh tokens

#### `/netlify/functions/dropbox-auth-callback.ts`
- Handles OAuth callback from Dropbox
- Exchanges authorization code for access/refresh tokens
- Saves tokens to `external_tokens` table
- **TODO**: Implement proper token encryption

#### `/netlify/functions/utils/encryption.ts`
- Placeholder encryption utilities
- **TODO**: Implement AES-256-CBC encryption for tokens

### 2. **Supabase Edge Function**

#### `/supabase/functions/list_dropbox/index.ts`
- Authenticates user via JWT
- Refreshes expired Dropbox tokens automatically
- Lists files from Dropbox (default: `/Apps/Assemblage`)
- Filters for image files only (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
- Prevents duplicates using `(provider, remote_id)` unique constraint
- Inserts new images with `metadata_status='pending'`
- Queues images for processing via `process_image` function
- Uses advisory lock to prevent race conditions

#### `/supabase/functions/list_dropbox/list_dropbox.test.ts`
- Unit tests for filtering logic
- Tests duplicate prevention
- Tests data formatting

### 3. **React Component**

#### `/assemblage-web/src/components/DropboxConnect.tsx`
- UI component for Dropbox connection management
- Shows connection status
- Handles connect/disconnect/sync actions
- Displays sync results

### 4. **Documentation**

#### `/README-DEV.md`
- Complete Dropbox setup guide
- Environment variable documentation
- Testing instructions
- Architecture overview
- Security considerations

#### `/.env.example` (Updated)
- Added Supabase environment variables
- Updated Dropbox redirect URI for Netlify functions

## Environment Variables Required

```bash
# Dropbox OAuth
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret
DROPBOX_REDIRECT_URI=http://localhost:8888/.netlify/functions/dropbox-auth-callback

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# TODO: Add for token encryption
TOKEN_ENCRYPTION_KEY=generate_32_byte_hex_key
```

## Database Schema (Already Exists)

From migration `20250529020932_add_user_collections_and_dropbox.sql`:
- `external_tokens` table with columns:
  - `user_id`, `provider`, `access_token`, `refresh_token`, `expires_at`
- `images` table extended with:
  - `user_id`, `provider`, `remote_id`, `thumb_src`
- RLS policies for proper user isolation

## TODOs

1. **Implement Token Encryption**
   - Update `/netlify/functions/utils/encryption.ts`
   - Use encryption in callback and list_dropbox functions
   - Add `TOKEN_ENCRYPTION_KEY` to environment

2. **Add Frontend Integration**
   - Import `DropboxConnect` component in main app
   - Add to user settings/profile page

3. **Implement Dropbox Thumbnail Download**
   - Update `process_image` function to handle `dropbox://` URLs
   - Use Dropbox API to download actual image content

4. **Add Error Handling UI**
   - Show user-friendly errors for connection failures
   - Handle rate limiting gracefully

5. **Production Deployment**
   - Set production environment variables
   - Update redirect URI for production domain
   - Enable HTTPS for OAuth security

## Testing Commands

```bash
# Start local development
netlify dev

# Test OAuth flow
# Navigate to: http://localhost:8888/.netlify/functions/dropbox-auth-start

# Test list_dropbox function (after connecting)
curl -X POST http://localhost:54321/functions/v1/list_dropbox \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path": "/Apps/Assemblage"}'

# Run unit tests
cd supabase/functions/list_dropbox
deno test --allow-net --allow-env list_dropbox.test.ts
```

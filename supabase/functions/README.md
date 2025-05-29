# Image Processing System

This document describes the enhanced image processing system for Assemblage with support for multiple providers, retry logic, rate limiting, and cost tracking.

## Overview

The image processing system handles:
- Thumbnail generation
- Color palette extraction
- OpenAI embeddings generation
- Support for multiple image sources (uploads, Dropbox)
- Automatic retry logic for failed operations
- Rate limiting for API calls
- Cost tracking and logging

## Database Schema Updates

Run the following migrations to set up the required database structure:

```bash
supabase db push
```

This will apply:
1. `20241227_add_image_processing_fields.sql` - Adds retry_count, provider, embedding fields
2. `20241227_add_kv_store.sql` - Creates KV store for rate limiting
3. `20241227_add_missing_image_columns.sql` - Adds palette, thumbnail, and user tracking fields

## Edge Functions

### 1. `process_image`

Main image processing function that:
- Downloads images from configured provider (Supabase Storage or Dropbox)
- Generates thumbnails (200x200 JPEG)
- Extracts color palettes (top 5 colors)
- Creates OpenAI embeddings for image search
- Implements retry logic and rate limiting

**Endpoint**: `POST /functions/v1/process_image`

**Request Body**:
```json
{
  "imageId": "unique-image-id"
}
```

**Response**:
```json
{
  "success": true,
  "imageId": "unique-image-id",
  "status": "complete",
  "thumbnail": "https://...",
  "palette": ["#ff0000", "#00ff00", "#0000ff"]
}
```

### 2. `retry_queue`

Processes failed image processing jobs on a schedule.

**Endpoint**: `POST /functions/v1/retry_queue`

Should be called by a cron job every 5 minutes with authorization header.

## Environment Variables

Add these to your `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Dropbox (if using Dropbox provider)
DROPBOX_ACCESS_TOKEN=your-dropbox-access-token

# Rate Limiting
MAX_EMBEDDING_CALLS_PER_MIN=20

# Cron Secret (for retry queue)
CRON_SECRET=your-secret-key
```

## Image Providers

### Upload Provider (Default)
- Images stored in Supabase Storage `user-images` bucket
- Used when `provider='upload'` or provider is not specified

### Dropbox Provider
- Downloads images from Dropbox using the Dropbox API
- Used when `provider='dropbox'`
- Requires `external_id` field with Dropbox file path

## Retry Logic

Failed embedding generations are automatically retried:
- Max retries: 3
- Retry delay: 5 minutes
- After max retries, image is marked with `metadata_status='error'`

## Rate Limiting

OpenAI API calls are rate-limited:
- Default: 20 calls per minute
- Uses KV store with minute-epoch keys
- Requests exceeding limit are rescheduled for 30 seconds later

## Cost Tracking

All embedding API calls are logged in `embedding_usage_log`:
- Tracks token usage
- Calculates cost (OpenAI: $0.0001 per 1K tokens)
- Associated with user_id for billing

## Testing

Run the test suite:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test
```

## Deployment

1. Deploy Edge Functions:
```bash
supabase functions deploy process_image
supabase functions deploy retry_queue
```

2. Set up cron job for retry queue (every 5 minutes):
```bash
curl -X POST https://your-project.supabase.co/functions/v1/retry_queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Usage Example

```typescript
// Process an image
const response = await fetch(`${SUPABASE_URL}/functions/v1/process_image`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ imageId: 'abc123' }),
});

const result = await response.json();
console.log('Thumbnail:', result.thumbnail);
console.log('Color palette:', result.palette);
```

## Monitoring

Monitor the system through:
1. `images` table - Check `metadata_status` and `retry_count`
2. `images_retry_queue` table - View pending retries
3. `embedding_usage_log` table - Track costs and usage
4. Edge Function logs in Supabase dashboard

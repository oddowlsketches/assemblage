# AI Prompt Customization for CMS

## Overview
I've added the ability to view and customize the AI prompts used for image analysis in the CMS. This will help you tune the metadata quality for your specific image collection.

## New Features

### 1. AI Settings Page in CMS
- New "AI Settings" tab in the CMS sidebar
- View and edit the prompts sent to OpenAI for image analysis
- Two prompt modes:
  - **Basic Prompt**: Simple analysis for description, tags, and image_role
  - **Enriched Prompt**: Detailed analysis including color detection, photograph vs illustration, white edge scoring, and palette suitability

### 2. Dynamic Prompt Loading
- The image metadata generation function now loads prompts from the database
- Changes to prompts apply to new image uploads immediately
- Existing images can be reprocessed using the "Reprocess" button in the image details modal

### 3. Better Metadata Parsing
- Supports both basic and enriched response formats
- Handles additional fields like:
  - `is_black_and_white`: Detects if image is truly B&W
  - `is_photograph`: Distinguishes photos from illustrations
  - `white_edge_score`: Measures amount of white/light edges (0-1)
  - `palette_suitability`: Categorizes color palette (vibrant/neutral/earthtone/muted/pastel)

## Deployment Steps

### 1. Run SQL to create kv_store table:
```sql
-- Create kv_store table if it doesn't exist
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Service role can manage kv_store" ON kv_store;
CREATE POLICY "Service role can manage kv_store" 
ON kv_store FOR ALL 
TO service_role
USING (true);

-- Insert default prompts
INSERT INTO kv_store (key, value) VALUES
  ('ai_prompt_basic', 'Analyze this collage image. Provide a detailed description of its composition, textures, and artistic elements. Also suggest 5 relevant tags that capture its essence and classify it as either "texture", "narrative", or "conceptual" based on its primary visual nature. Format your response as JSON {"description":string, "tags":string[], "image_role":string}'),
  ('ai_prompt_enriched', 'Analyze this black and white collage/assemblage image in detail.

First, determine if this image contains any recognizable human figures or faces in the foreground or as primary subjects. If yes, classify as "narrative". If the image is primarily abstract patterns, textures, or backgrounds without clear subjects, classify as "texture". If it contains symbolic or metaphorical elements but no clear human subjects, classify as "conceptual".

Provide:
1. A rich, detailed description (2-3 sentences) focusing on composition, visual elements, and artistic qualities
2. 5-8 specific, relevant tags (avoid generic terms)
3. Whether the image is truly black and white or has color elements
4. Whether it appears to be a photograph or an illustration/artwork
5. A score (0-1) for how much white/light edge space the image has

Format your response as JSON:
{
  "description": "detailed description here",
  "tags": ["tag1", "tag2", ...],
  "image_role": "texture|narrative|conceptual",
  "is_black_and_white": true/false,
  "is_photograph": true/false,
  "white_edge_score": 0.0-1.0,
  "palette_suitability": "vibrant|neutral|earthtone|muted|pastel"
}')
ON CONFLICT (key) DO NOTHING;
```

### 2. Deploy code changes:
```bash
cd /Users/emilyschwartzman/assemblage-app
git add -A
git commit -m "Add AI prompt customization to CMS"
git push
```

## Using the AI Settings

1. **Access AI Settings**:
   - Go to the CMS
   - Click "AI Settings" in the sidebar

2. **View/Edit Prompts**:
   - Choose between "Basic Prompt" and "Enriched Prompt" tabs
   - The enriched prompt is recommended for better metadata quality
   - Edit the prompt text to improve accuracy for your specific images

3. **Save Changes**:
   - Click "Save Changes" to update the prompts
   - New uploads will use the updated prompts immediately

4. **Reprocess Existing Images**:
   - Open any image in the CMS
   - Click "Reprocess" to re-analyze with the new prompt
   - This is useful for testing prompt changes

## Tips for Better Prompts

1. **Be Specific About Categories**:
   - Define clearly what makes an image "texture" vs "narrative" vs "conceptual"
   - Example: "If the image shows a human figure as the main subject, classify as 'narrative'"

2. **Guide Tag Generation**:
   - Specify the types of tags you want
   - Example: "Include tags for: dominant colors, textures, compositional elements, mood, and artistic style"

3. **Handle Edge Cases**:
   - Address specific issues you've noticed
   - Example: "Even if the image appears mostly gray, check for subtle color tints before marking as black_and_white"

4. **Test Iteratively**:
   - Make small changes
   - Test on a few images using "Reprocess"
   - Refine based on results

## Example Improved Prompt for Your Case

Since you mentioned the AI incorrectly identified a color image as B&W and misclassified a narrative image as texture, here's an improved prompt snippet:

```
First, carefully examine the image for ANY color elements beyond pure black, white, and gray. Even subtle pink, beige, or cream tones mean the image is NOT black and white.

For image_role classification:
- "narrative": ANY image with a human figure, face, or body part visible as a main element
- "texture": ONLY images that are purely abstract patterns, surfaces, or backgrounds with no identifiable subjects
- "conceptual": Images with symbolic elements, objects, or scenes but no human figures
```

This should help improve the accuracy of the metadata generation!

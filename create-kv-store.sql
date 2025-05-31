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

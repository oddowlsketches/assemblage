-- Add rotation column to images table
-- The rotation value represents degrees: 0, 90, 180, 270
ALTER TABLE images ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- Add constraint to ensure rotation is one of the valid values (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_rotation_values'
    ) THEN
        ALTER TABLE images ADD CONSTRAINT valid_rotation_values CHECK (rotation IN (0, 90, 180, 270));
    END IF;
END $$;

-- Create index for rotation queries (optional, but could be useful for filtering)
CREATE INDEX IF NOT EXISTS idx_images_rotation ON images(rotation);

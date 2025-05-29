-- Add rotation column to images table
-- The rotation value represents degrees: 0, 90, 180, 270
ALTER TABLE images ADD COLUMN rotation INTEGER DEFAULT 0;

-- Add constraint to ensure rotation is one of the valid values
ALTER TABLE images ADD CONSTRAINT valid_rotation_values CHECK (rotation IN (0, 90, 180, 270));

-- Create index for rotation queries (optional, but could be useful for filtering)
CREATE INDEX idx_images_rotation ON images(rotation);

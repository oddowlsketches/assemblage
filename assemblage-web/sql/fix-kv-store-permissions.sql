-- Fix kv_store table permissions
-- Enable RLS on kv_store table
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "kv_store_read_all" ON kv_store;
DROP POLICY IF EXISTS "kv_store_write_admin" ON kv_store;

-- Allow anyone to read kv_store entries
CREATE POLICY "kv_store_read_all" ON kv_store
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update kv_store entries
-- This is safe because we're only storing AI prompts and other non-sensitive config
CREATE POLICY "kv_store_write_authenticated" ON kv_store
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Make sure the table has proper permissions for service role
GRANT ALL ON kv_store TO service_role;
GRANT ALL ON kv_store TO authenticated;
GRANT SELECT ON kv_store TO anon;

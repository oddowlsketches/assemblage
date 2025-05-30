-- Create external_tokens table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS external_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE external_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own tokens
CREATE POLICY "Users can manage own tokens" ON external_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_external_tokens_user_provider ON external_tokens(user_id, provider);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON external_tokens TO authenticated;
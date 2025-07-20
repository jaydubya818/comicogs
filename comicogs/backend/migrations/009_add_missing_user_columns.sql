-- Migration 009: Add missing user table columns
-- Complete the users table schema to match the auth system requirements

-- Add missing columns for user profiles and verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"collection_public": true, "wantlist_public": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for user profile queries
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);

-- Add comments for documentation
COMMENT ON COLUMN users.is_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile image';
COMMENT ON COLUMN users.bio IS 'User biography/description';
COMMENT ON COLUMN users.location IS 'User location (city, state, country)';
COMMENT ON COLUMN users.privacy_settings IS 'JSON object containing user privacy preferences';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last profile update'; 
-- Add missing columns to users table for tests

-- Add developer_enabled column
ALTER TABLE users ADD COLUMN IF NOT EXISTS developer_enabled BOOLEAN DEFAULT FALSE;

-- Add last_login_at column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add refresh_token column for authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Update existing users to have developer_enabled = true for admin role
UPDATE users SET developer_enabled = TRUE WHERE role = 'admin';
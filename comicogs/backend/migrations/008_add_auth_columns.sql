-- Migration 008: Add authentication columns to users table
-- Required for JWT-based authentication system

-- Add role column for user authorization
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Add refresh_token column for secure token refresh
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update any existing users to have the 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: user, admin, moderator';
COMMENT ON COLUMN users.refresh_token IS 'JWT refresh token for secure session management'; 
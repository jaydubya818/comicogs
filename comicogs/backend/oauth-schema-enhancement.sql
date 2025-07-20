-- ==========================================
-- OAUTH 2.0 SCHEMA ENHANCEMENT
-- Task 14: OAuth Authentication & User Management System
-- Modeled after Discogs authentication flow
-- ==========================================

-- OAuth Applications table (for developer apps)
CREATE TABLE oauth_applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    owner_user_id INT NOT NULL,
    redirect_uris TEXT[], -- Array of allowed redirect URIs
    scopes TEXT[] DEFAULT ARRAY['read']::TEXT[], -- Available scopes
    application_type VARCHAR(50) DEFAULT 'web', -- web, native, spa
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    privacy_policy_url VARCHAR(500),
    terms_of_service_url VARCHAR(500),
    is_approved BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth Authorization Codes (temporary codes)
CREATE TABLE oauth_authorization_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    application_id INT NOT NULL,
    user_id INT NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES oauth_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth Access Tokens
CREATE TABLE oauth_access_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    application_id INT,
    user_id INT NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES oauth_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth Refresh Tokens
CREATE TABLE oauth_refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    access_token_id INT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (access_token_id) REFERENCES oauth_access_tokens(id) ON DELETE CASCADE
);

-- Personal Access Tokens (like Discogs user tokens)
CREATE TABLE personal_access_tokens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    scopes TEXT[] NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth User Consents (track what users have authorized)
CREATE TABLE oauth_user_consents (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    application_id INT NOT NULL,
    scopes TEXT[] NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES oauth_applications(id) ON DELETE CASCADE,
    UNIQUE(user_id, application_id)
);

-- API Rate Limiting
CREATE TABLE api_rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- user_id, client_id, or IP
    identifier_type VARCHAR(50) NOT NULL, -- user, application, ip
    endpoint VARCHAR(255) NOT NULL,
    requests_count INT DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Analytics
CREATE TABLE api_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    application_id INT,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    response_time_ms INT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (application_id) REFERENCES oauth_applications(id) ON DELETE SET NULL
);

-- User Sessions (for web authentication)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced Users table modifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS developer_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- OAuth Scopes definition table
CREATE TABLE oauth_scopes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default OAuth scopes (modeled after Discogs)
INSERT INTO oauth_scopes (name, description, is_default) VALUES
('read', 'Read access to public data', TRUE),
('read:user', 'Read access to user profile information', FALSE),
('read:collection', 'Read access to user collection', FALSE),
('write:collection', 'Modify user collection', FALSE),
('read:wantlist', 'Read access to user wantlist', FALSE),
('write:wantlist', 'Modify user wantlist', FALSE),
('read:marketplace', 'Read access to marketplace listings', FALSE),
('write:marketplace', 'Create and modify marketplace listings', FALSE),
('read:orders', 'Read access to marketplace orders', FALSE),
('write:orders', 'Process marketplace orders', FALSE);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- OAuth Applications indexes
CREATE INDEX idx_oauth_applications_client_id ON oauth_applications(client_id);
CREATE INDEX idx_oauth_applications_owner ON oauth_applications(owner_user_id);

-- OAuth Authorization Codes indexes
CREATE INDEX idx_oauth_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX idx_oauth_auth_codes_expires ON oauth_authorization_codes(expires_at);
CREATE INDEX idx_oauth_auth_codes_user ON oauth_authorization_codes(user_id);

-- OAuth Access Tokens indexes
CREATE INDEX idx_oauth_access_tokens_token ON oauth_access_tokens(token);
CREATE INDEX idx_oauth_access_tokens_user ON oauth_access_tokens(user_id);
CREATE INDEX idx_oauth_access_tokens_app ON oauth_access_tokens(application_id);
CREATE INDEX idx_oauth_access_tokens_expires ON oauth_access_tokens(expires_at);

-- Personal Access Tokens indexes
CREATE INDEX idx_personal_tokens_token ON personal_access_tokens(token);
CREATE INDEX idx_personal_tokens_user ON personal_access_tokens(user_id);

-- Rate limiting indexes
CREATE INDEX idx_rate_limits_identifier ON api_rate_limits(identifier, identifier_type);
CREATE INDEX idx_rate_limits_window ON api_rate_limits(window_start);

-- Usage logs indexes
CREATE INDEX idx_usage_logs_user ON api_usage_logs(user_id);
CREATE INDEX idx_usage_logs_app ON api_usage_logs(application_id);
CREATE INDEX idx_usage_logs_created ON api_usage_logs(created_at);

-- Sessions indexes
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

COMMIT; 
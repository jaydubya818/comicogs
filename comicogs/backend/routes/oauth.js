const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const OAuthService = require('../services/OAuthService');
const { 
  authenticateToken, 
  requireDeveloper, 
  requireOwnership,
  oauthCors,
  requireJson,
  optionalAuth
} = require('../middleware/enhancedAuthMiddleware');

const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'comicogs',
  user: process.env.DB_USER || 'jaywest',
  password: process.env.DB_PASSWORD || ''
});

// Apply CORS and JSON middleware to all OAuth routes
router.use(oauthCors);
router.use(requireJson);

// ==========================================
// USER AUTHENTICATION ROUTES
// ==========================================

// POST /oauth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username, email, and password are required.'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 8 characters long.'
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this username or email already exists.'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_verified, login_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash, true, 0] // Auto-verify for now
    );
    
    const user = result.rows[0];
    
    // Generate a default personal access token
    const tokenResult = await OAuthService.generatePersonalAccessToken(
      user.id,
      'Default Token',
      ['read', 'read:user']
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token: tokenResult.success ? {
        token: tokenResult.token.token,
        name: tokenResult.token.name,
        scopes: tokenResult.token.scopes
      } : null
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration.'
    });
  }
});

// POST /oauth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required.'
      });
    }
    
    // Get user by username or email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    // Update login stats
    await pool.query(
      'UPDATE users SET last_login_at = NOW(), login_count = login_count + 1 WHERE id = $1',
      [user.id]
    );
    
    // Get user's tokens
    const tokensResult = await OAuthService.getUserPersonalTokens(user.id);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        developer_enabled: user.developer_enabled,
        last_login_at: user.last_login_at,
        login_count: user.login_count + 1
      },
      tokens: tokensResult.success ? tokensResult.tokens : []
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login.'
    });
  }
});

// ==========================================
// PERSONAL ACCESS TOKEN ROUTES (like Discogs user tokens)
// ==========================================

// GET /oauth/tokens - Get user's personal access tokens
router.get('/tokens', authenticateToken(), async (req, res) => {
  try {
    const result = await OAuthService.getUserPersonalTokens(req.user.id);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch tokens',
        message: result.error
      });
    }
    
    res.json({
      tokens: result.tokens,
      count: result.tokens.length
    });
    
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch personal access tokens.'
    });
  }
});

// POST /oauth/tokens - Generate new personal access token
router.post('/tokens', authenticateToken(), async (req, res) => {
  try {
    const { name, scopes, expires_in } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Missing token name',
        message: 'Token name is required.'
      });
    }
    
    const validScopes = ['read', 'read:user', 'read:collection', 'write:collection', 
                        'read:wantlist', 'write:wantlist', 'read:marketplace', 'write:marketplace'];
    
    const tokenScopes = scopes || ['read'];
    
    // Validate scopes
    const invalidScopes = tokenScopes.filter(scope => !validScopes.includes(scope));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        error: 'Invalid scopes',
        message: `Invalid scopes: ${invalidScopes.join(', ')}`,
        valid_scopes: validScopes
      });
    }
    
    const result = await OAuthService.generatePersonalAccessToken(
      req.user.id,
      name,
      tokenScopes,
      expires_in
    );
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Token generation failed',
        message: result.error
      });
    }
    
    res.status(201).json({
      message: 'Personal access token created successfully',
      token: {
        id: result.token.id,
        name: result.token.name,
        token: result.token.token, // Show full token only on creation
        scopes: result.token.scopes,
        expires_at: result.token.expires_at,
        created_at: result.token.created_at
      }
    });
    
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create personal access token.'
    });
  }
});

// DELETE /oauth/tokens/:id - Revoke personal access token
router.delete('/tokens/:id', authenticateToken(), async (req, res) => {
  try {
    const tokenId = parseInt(req.params.id);
    
    if (!tokenId) {
      return res.status(400).json({
        error: 'Invalid token ID',
        message: 'Token ID must be a valid number.'
      });
    }
    
    const result = await OAuthService.revokePersonalAccessToken(tokenId, req.user.id);
    
    if (!result.success) {
      return res.status(404).json({
        error: 'Token not found',
        message: result.error
      });
    }
    
    res.json({
      message: 'Personal access token revoked successfully'
    });
    
  } catch (error) {
    console.error('Error revoking token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to revoke personal access token.'
    });
  }
});

// ==========================================
// OAUTH 2.0 APPLICATION MANAGEMENT
// ==========================================

// GET /oauth/applications - Get user's OAuth applications
router.get('/applications', requireDeveloper, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, name, description, client_id, redirect_uris, application_type,
        website_url, logo_url, is_approved, is_suspended, created_at, updated_at
      FROM oauth_applications
      WHERE owner_user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({
      applications: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch OAuth applications.'
    });
  }
});

// POST /oauth/applications - Create OAuth application
router.post('/applications', requireDeveloper, async (req, res) => {
  try {
    const {
      name,
      description,
      redirect_uris,
      application_type,
      website_url,
      logo_url,
      privacy_policy_url,
      terms_of_service_url
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Missing application name',
        message: 'Application name is required.'
      });
    }
    
    if (!redirect_uris || redirect_uris.length === 0) {
      return res.status(400).json({
        error: 'Missing redirect URIs',
        message: 'At least one redirect URI is required.'
      });
    }
    
    const result = await OAuthService.createOAuthApplication(req.user.id, {
      name,
      description,
      redirect_uris,
      application_type,
      website_url,
      logo_url,
      privacy_policy_url,
      terms_of_service_url
    });
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Application creation failed',
        message: result.error
      });
    }
    
    res.status(201).json({
      message: 'OAuth application created successfully',
      application: {
        id: result.application.id,
        name: result.application.name,
        description: result.application.description,
        client_id: result.application.client_id,
        client_secret: result.application.client_secret,
        redirect_uris: result.application.redirect_uris,
        application_type: result.application.application_type,
        website_url: result.application.website_url,
        logo_url: result.application.logo_url,
        privacy_policy_url: result.application.privacy_policy_url,
        terms_of_service_url: result.application.terms_of_service_url,
        is_approved: result.application.is_approved,
        created_at: result.application.created_at
      }
    });
    
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create OAuth application.'
    });
  }
});

// ==========================================
// OAUTH 2.0 AUTHORIZATION FLOW
// ==========================================

// GET /oauth/authorize - OAuth authorization endpoint
router.get('/authorize', optionalAuth, async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, response_type } = req.query;
    
    if (response_type !== 'code') {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Only authorization code flow is supported.'
      });
    }
    
    if (!client_id || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'client_id and redirect_uri are required.'
      });
    }
    
    // Get application details
    const appResult = await OAuthService.getOAuthApplication(client_id);
    
    if (!appResult.found) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Invalid client_id or application not approved.'
      });
    }
    
    const application = appResult.application;
    
    // Validate redirect URI
    if (!application.redirect_uris.includes(redirect_uri)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'redirect_uri not registered for this application.'
      });
    }
    
    const requestedScopes = scope ? scope.split(' ') : ['read'];
    
    // If user is not authenticated, redirect to login
    if (!req.user) {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?` +
        `return_to=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(loginUrl);
    }
    
    // Show authorization page
    res.json({
      authorization_required: true,
      application: {
        name: application.name,
        description: application.description,
        website_url: application.website_url,
        logo_url: application.logo_url
      },
      requested_scopes: requestedScopes,
      user: {
        username: req.user.username
      },
      authorize_url: `/oauth/authorize/confirm`,
      params: {
        client_id,
        redirect_uri,
        scope,
        state
      }
    });
    
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during authorization.'
    });
  }
});

// POST /oauth/authorize/confirm - Confirm authorization
router.post('/authorize/confirm', authenticateToken(), async (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, authorized } = req.body;
    
    if (!authorized) {
      const params = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User denied authorization',
        state: state || ''
      });
      return res.json({
        redirect_url: `${redirect_uri}?${params.toString()}`
      });
    }
    
    // Get application
    const appResult = await OAuthService.getOAuthApplication(client_id);
    if (!appResult.found) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Invalid client_id.'
      });
    }
    
    const application = appResult.application;
    const requestedScopes = scope ? scope.split(' ') : ['read'];
    
    // Create authorization code
    const codeResult = await OAuthService.createAuthorizationCode(
      application.id,
      req.user.id,
      redirect_uri,
      requestedScopes
    );
    
    if (!codeResult.success) {
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to create authorization code.'
      });
    }
    
    // Record user consent
    await pool.query(
      `INSERT INTO oauth_user_consents (user_id, application_id, scopes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, application_id)
       DO UPDATE SET scopes = $3, granted_at = NOW(), revoked_at = NULL`,
      [req.user.id, application.id, requestedScopes]
    );
    
    const params = new URLSearchParams({
      code: codeResult.code,
      state: state || ''
    });
    
    res.json({
      redirect_url: `${redirect_uri}?${params.toString()}`
    });
    
  } catch (error) {
    console.error('Authorization confirmation error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during authorization confirmation.'
    });
  }
});

// POST /oauth/token - Token exchange endpoint
router.post('/token', async (req, res) => {
  try {
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;
    
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported.'
      });
    }
    
    if (!code || !client_id || !client_secret || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code, client_id, client_secret, and redirect_uri are required.'
      });
    }
    
    const result = await OAuthService.exchangeCodeForToken(
      code,
      client_id,
      client_secret,
      redirect_uri
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: result.error
      });
    }
    
    res.json({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
      expires_in: result.expires_in,
      scope: result.scope
    });
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during token exchange.'
    });
  }
});

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// GET /oauth/scopes - Get available OAuth scopes
router.get('/scopes', async (req, res) => {
  try {
    const result = await OAuthService.getAvailableScopes();
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Internal server error',
        message: result.error
      });
    }
    
    res.json({
      scopes: result.scopes
    });
    
  } catch (error) {
    console.error('Error fetching scopes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch OAuth scopes.'
    });
  }
});

// GET /oauth/me - Get current user info (like Discogs identity endpoint)
router.get('/me', authenticateToken(), async (req, res) => {
  try {
    const userQuery = `
      SELECT 
        id, username, email, role, bio, location, website_url,
        profile_image_url, developer_enabled, two_factor_enabled,
        timezone, language, last_login_at, login_count, created_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(userQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Current user not found in database.'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      location: user.location,
      website_url: user.website_url,
      profile_image_url: user.profile_image_url,
      developer_enabled: user.developer_enabled,
      two_factor_enabled: user.two_factor_enabled,
      timezone: user.timezone,
      language: user.language,
      last_login_at: user.last_login_at,
      login_count: user.login_count,
      created_at: user.created_at,
      scopes: req.scopes,
      token_info: req.tokenInfo,
      application: req.application
    });
    
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user information.'
    });
  }
});

module.exports = router; 
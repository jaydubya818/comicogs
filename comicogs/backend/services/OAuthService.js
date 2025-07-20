const crypto = require("crypto");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

class OAuthService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "comicogs",
      user: process.env.DB_USER || "jaywest",
      password: process.env.DB_PASSWORD || "",
    });

    this.jwtSecret =
      process.env.JWT_SECRET || "comicogs-jwt-secret-change-in-production";
    this.defaultTokenExpiry = 30 * 24 * 60 * 60; // 30 days in seconds
    this.authCodeExpiry = 10 * 60; // 10 minutes in seconds
  }

  // ==========================================
  // PERSONAL ACCESS TOKENS (like Discogs user tokens)
  // ==========================================

  /**
   * Generate a personal access token for a user
   */
  async generatePersonalAccessToken(
    userId,
    name,
    scopes = ["read"],
    expiresIn = null
  ) {
    try {
      const token = this.generateSecureToken();
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      const query = `
        INSERT INTO personal_access_tokens (name, token, user_id, scopes, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        name,
        token,
        userId,
        scopes,
        expiresAt,
      ]);
      return {
        success: true,
        token: result.rows[0],
      };
    } catch (error) {
      console.error("Error generating personal access token:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate a personal access token
   */
  async validatePersonalAccessToken(token) {
    try {
      const query = `
        SELECT pat.*, u.username, u.email, u.role, u.developer_enabled
        FROM personal_access_tokens pat
        JOIN users u ON pat.user_id = u.id
        WHERE pat.token = $1 
        AND (pat.expires_at IS NULL OR pat.expires_at > NOW())
      `;

      const result = await this.pool.query(query, [token]);

      if (result.rows.length === 0) {
        return { valid: false, error: "Invalid or expired token" };
      }

      const tokenData = result.rows[0];

      // Update last used timestamp
      await this.pool.query(
        "UPDATE personal_access_tokens SET last_used_at = NOW() WHERE id = $1",
        [tokenData.id]
      );

      return {
        valid: true,
        user: {
          id: tokenData.user_id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role,
          developer_enabled: tokenData.developer_enabled,
        },
        scopes: tokenData.scopes,
        tokenInfo: {
          id: tokenData.id,
          name: tokenData.name,
          created_at: tokenData.created_at,
          last_used_at: tokenData.last_used_at,
        },
      };
    } catch (error) {
      console.error("Error validating personal access token:", error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get all personal access tokens for a user
   */
  async getUserPersonalTokens(userId) {
    try {
      const query = `
        SELECT id, name, token, scopes, last_used_at, expires_at, created_at
        FROM personal_access_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query, [userId]);
      return {
        success: true,
        tokens: result.rows.map((token) => ({
          ...token,
          token: `${token.token.substring(0, 8)}...`, // Mask token for security
        })),
      };
    } catch (error) {
      console.error("Error getting user tokens:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke a personal access token
   */
  async revokePersonalAccessToken(tokenId, userId) {
    try {
      const query = `
        DELETE FROM personal_access_tokens
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await this.pool.query(query, [tokenId, userId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Token not found or not owned by user",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error revoking personal access token:", error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // OAUTH 2.0 FLOW
  // ==========================================

  /**
   * Create a new OAuth application
   */
  async createOAuthApplication(userId, appData) {
    try {
      const clientId = this.generateClientId();
      const clientSecret = this.generateClientSecret();

      const query = `
        INSERT INTO oauth_applications (
          name, description, client_id, client_secret, owner_user_id,
          redirect_uris, application_type, website_url, logo_url,
          privacy_policy_url, terms_of_service_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        appData.name,
        appData.description,
        clientId,
        clientSecret,
        userId,
        appData.redirect_uris || [],
        appData.application_type || "web",
        appData.website_url,
        appData.logo_url,
        appData.privacy_policy_url,
        appData.terms_of_service_url,
      ];

      const result = await this.pool.query(query, values);
      return {
        success: true,
        application: result.rows[0],
      };
    } catch (error) {
      console.error("Error creating OAuth application:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get OAuth application by client ID
   */
  async getOAuthApplication(clientId) {
    try {
      const query = `
        SELECT * FROM oauth_applications
        WHERE client_id = $1 AND is_approved = true AND is_suspended = false
      `;

      const result = await this.pool.query(query, [clientId]);

      if (result.rows.length === 0) {
        return { found: false, error: "Application not found or not approved" };
      }

      return {
        found: true,
        application: result.rows[0],
      };
    } catch (error) {
      console.error("Error getting OAuth application:", error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  generateAuthorizationUrl(clientId, redirectUri, scopes, state) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state: state || this.generateState(),
    });

    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Create authorization code
   */
  async createAuthorizationCode(applicationId, userId, redirectUri, scopes) {
    try {
      const code = this.generateAuthorizationCode();
      const expiresAt = new Date(Date.now() + this.authCodeExpiry * 1000);

      const query = `
        INSERT INTO oauth_authorization_codes (
          code, application_id, user_id, redirect_uri, scopes, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING code
      `;

      const result = await this.pool.query(query, [
        code,
        applicationId,
        userId,
        redirectUri,
        scopes,
        expiresAt,
      ]);

      return {
        success: true,
        code: result.rows[0].code,
      };
    } catch (error) {
      console.error("Error creating authorization code:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    try {
      // Validate application
      const appResult = await this.pool.query(
        "SELECT * FROM oauth_applications WHERE client_id = $1 AND client_secret = $2",
        [clientId, clientSecret]
      );

      if (appResult.rows.length === 0) {
        return { success: false, error: "Invalid client credentials" };
      }

      const application = appResult.rows[0];

      // Get and validate authorization code
      const codeQuery = `
        SELECT * FROM oauth_authorization_codes
        WHERE code = $1 AND application_id = $2 AND redirect_uri = $3
        AND expires_at > NOW() AND used = false
      `;

      const codeResult = await this.pool.query(codeQuery, [
        code,
        application.id,
        redirectUri,
      ]);

      if (codeResult.rows.length === 0) {
        return {
          success: false,
          error: "Invalid or expired authorization code",
        };
      }

      const authCode = codeResult.rows[0];

      // Mark code as used
      await this.pool.query(
        "UPDATE oauth_authorization_codes SET used = true WHERE id = $1",
        [authCode.id]
      );

      // Create access token
      const accessToken = this.generateAccessToken();
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + this.defaultTokenExpiry * 1000);

      // Insert access token
      const tokenQuery = `
        INSERT INTO oauth_access_tokens (token, application_id, user_id, scopes, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const tokenResult = await this.pool.query(tokenQuery, [
        accessToken,
        application.id,
        authCode.user_id,
        authCode.scopes,
        expiresAt,
      ]);

      // Insert refresh token
      await this.pool.query(
        "INSERT INTO oauth_refresh_tokens (token, access_token_id) VALUES ($1, $2)",
        [refreshToken, tokenResult.rows[0].id]
      );

      return {
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: this.defaultTokenExpiry,
        scope: authCode.scopes.join(" "),
      };
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate OAuth access token
   */
  async validateOAuthToken(token) {
    try {
      const query = `
        SELECT 
          oat.*,
          u.username, u.email, u.role, u.developer_enabled,
          oa.name as app_name, oa.client_id
        FROM oauth_access_tokens oat
        JOIN users u ON oat.user_id = u.id
        LEFT JOIN oauth_applications oa ON oat.application_id = oa.id
        WHERE oat.token = $1 
        AND oat.revoked = false
        AND (oat.expires_at IS NULL OR oat.expires_at > NOW())
      `;

      const result = await this.pool.query(query, [token]);

      if (result.rows.length === 0) {
        return { valid: false, error: "Invalid or expired token" };
      }

      const tokenData = result.rows[0];

      // Update last used timestamp
      await this.pool.query(
        "UPDATE oauth_access_tokens SET last_used_at = NOW() WHERE id = $1",
        [tokenData.id]
      );

      return {
        valid: true,
        user: {
          id: tokenData.user_id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role,
          developer_enabled: tokenData.developer_enabled,
        },
        scopes: tokenData.scopes,
        application: {
          id: tokenData.application_id,
          name: tokenData.app_name,
          client_id: tokenData.client_id,
        },
      };
    } catch (error) {
      console.error("Error validating OAuth token:", error);
      return { valid: false, error: error.message };
    }
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================

  /**
   * Check rate limit for API requests
   */
  async checkRateLimit(
    identifier,
    identifierType,
    endpoint,
    limit = 1000,
    window = 3600
  ) {
    try {
      const windowStart = new Date(Date.now() - window * 1000);

      // Clean old entries
      await this.pool.query(
        "DELETE FROM api_rate_limits WHERE window_start < $1",
        [windowStart]
      );

      // Check current usage
      const query = `
        SELECT COALESCE(SUM(requests_count), 0) as total_requests
        FROM api_rate_limits
        WHERE identifier = $1 AND identifier_type = $2 AND endpoint = $3
        AND window_start >= $4
      `;

      const result = await this.pool.query(query, [
        identifier,
        identifierType,
        endpoint,
        windowStart,
      ]);

      const currentRequests = parseInt(result.rows[0].total_requests);

      if (currentRequests >= limit) {
        return {
          allowed: false,
          current: currentRequests,
          limit,
          resetTime: new Date(Date.now() + window * 1000),
        };
      }

      // Record this request
      await this.pool.query(
        `INSERT INTO api_rate_limits (identifier, identifier_type, endpoint, requests_count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (identifier, identifier_type, endpoint, window_start)
         DO UPDATE SET requests_count = api_rate_limits.requests_count + 1`,
        [identifier, identifierType, endpoint]
      );

      return {
        allowed: true,
        current: currentRequests + 1,
        limit,
        remaining: limit - currentRequests - 1,
      };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // Allow request on error to avoid breaking the API
      return { allowed: true, current: 0, limit };
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  generateSecureToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  generateClientId() {
    return crypto.randomBytes(16).toString("hex");
  }

  generateClientSecret() {
    return crypto.randomBytes(32).toString("hex");
  }

  generateAuthorizationCode() {
    return crypto.randomBytes(32).toString("hex");
  }

  generateAccessToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  generateRefreshToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  generateState() {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Log API usage for analytics
   */
  async logApiUsage(
    userId,
    applicationId,
    endpoint,
    method,
    statusCode,
    responseTime,
    userAgent,
    ipAddress
  ) {
    try {
      const query = `
        INSERT INTO api_usage_logs (
          user_id, application_id, endpoint, method, status_code,
          response_time_ms, user_agent, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.pool.query(query, [
        userId,
        applicationId,
        endpoint,
        method,
        statusCode,
        responseTime,
        userAgent,
        ipAddress,
      ]);
    } catch (error) {
      console.error("Error logging API usage:", error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get available OAuth scopes
   */
  async getAvailableScopes() {
    try {
      const query = "SELECT * FROM oauth_scopes ORDER BY name";
      const result = await this.pool.query(query);

      return {
        success: true,
        scopes: result.rows,
      };
    } catch (error) {
      console.error("Error getting OAuth scopes:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has specific scopes
   */
  hasScope(userScopes, requiredScopes) {
    if (!Array.isArray(requiredScopes)) {
      requiredScopes = [requiredScopes];
    }

    return requiredScopes.every((scope) => userScopes.includes(scope));
  }
}

module.exports = new OAuthService();

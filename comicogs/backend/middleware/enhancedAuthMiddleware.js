const OAuthService = require('../services/OAuthService');

// ==========================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// Supports OAuth tokens, Personal Access Tokens, and JWT
// ==========================================

/**
 * Enhanced token authentication middleware
 * Supports multiple token types like Discogs
 */
const authenticateToken = (requiredScopes = []) => {
  return async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Extract token from header
      const authHeader = req.headers['authorization'];
      const userToken = req.headers['user-token']; // Discogs-style user token header
      
      let token = null;
      let tokenType = 'bearer';
      
      if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2) {
          const scheme = parts[0];
          const credentials = parts[1];
          
          if (/^Bearer$/i.test(scheme)) {
            token = credentials;
            tokenType = 'bearer';
          } else if (/^Discogs$/i.test(scheme)) {
            token = credentials;
            tokenType = 'discogs';
          }
        }
      } else if (userToken) {
        token = userToken;
        tokenType = 'user-token';
      }
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No access token provided. Include "Authorization: Bearer <token>" header or "User-Token" header.'
        });
      }
      
      let authResult;
      
      // Try different token validation methods
      if (tokenType === 'user-token' || tokenType === 'discogs') {
        // Personal Access Token (like Discogs user tokens)
        authResult = await OAuthService.validatePersonalAccessToken(token);
      } else {
        // OAuth Access Token
        authResult = await OAuthService.validateOAuthToken(token);
        
        // If OAuth validation fails, try personal access token
        if (!authResult.valid) {
          authResult = await OAuthService.validatePersonalAccessToken(token);
        }
      }
      
      if (!authResult.valid) {
        return res.status(401).json({
          error: 'Invalid token',
          message: authResult.error || 'The provided token is invalid or expired.'
        });
      }
      
      // Check required scopes
      if (requiredScopes.length > 0) {
        const hasRequiredScopes = OAuthService.hasScope(authResult.scopes, requiredScopes);
        if (!hasRequiredScopes) {
          return res.status(403).json({
            error: 'Insufficient scope',
            message: `This endpoint requires scopes: ${requiredScopes.join(', ')}`,
            provided_scopes: authResult.scopes,
            required_scopes: requiredScopes
          });
        }
      }
      
      // Set user information in request
      req.user = authResult.user;
      req.scopes = authResult.scopes;
      req.tokenInfo = authResult.tokenInfo;
      req.application = authResult.application;
      
      // Rate limiting
      const identifier = authResult.application?.client_id || authResult.user.id.toString();
      const identifierType = authResult.application ? 'application' : 'user';
      
      const rateLimitResult = await OAuthService.checkRateLimit(
        identifier,
        identifierType,
        req.path,
        1000, // 1000 requests per hour
        3600  // 1 hour window
      );
      
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          rate_limit: {
            limit: rateLimitResult.limit,
            current: rateLimitResult.current,
            reset_time: rateLimitResult.resetTime
          }
        });
      }
      
      // Add rate limit headers (like Discogs)
      res.set({
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
        'X-RateLimit-Used': rateLimitResult.current.toString()
      });
      
      // Log API usage for analytics
      const responseTime = Date.now() - startTime;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Log after response to not delay the request
      res.on('finish', () => {
        OAuthService.logApiUsage(
          authResult.user.id,
          authResult.application?.id,
          req.path,
          req.method,
          res.statusCode,
          responseTime,
          userAgent,
          ipAddress
        );
      });
      
      next();
      
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({
        error: 'Authentication service error',
        message: 'An error occurred during authentication.'
      });
    }
  };
};

/**
 * Optional authentication - allows both authenticated and anonymous requests
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const userToken = req.headers['user-token'];
  
  if (!authHeader && !userToken) {
    // No authentication provided, continue as anonymous
    req.user = null;
    req.scopes = ['read']; // Default read-only access
    return next();
  }
  
  // Authentication provided, validate it
  authenticateToken()(req, res, next);
};

/**
 * Require specific scopes
 */
const requireScopes = (scopes) => {
  return authenticateToken(scopes);
};

/**
 * Admin only middleware
 */
const requireAdmin = authenticateToken(['admin']);

/**
 * Developer middleware - requires user to have developer access
 */
const requireDeveloper = async (req, res, next) => {
  try {
    await authenticateToken()(req, res, () => {
      if (req.user.role !== 'admin' && !req.user.developer_enabled) {
        return res.status(403).json({
          error: 'Developer access required',
          message: 'This endpoint requires developer privileges. Enable developer access in your account settings.'
        });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns resource
 */
const requireOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'User ID not found in request.'
      });
    }
    
    if (req.user.role === 'admin') {
      // Admins can access any resource
      return next();
    }
    
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * CORS middleware for OAuth endpoints
 */
const oauthCors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * API versioning middleware
 */
const apiVersion = (version) => {
  return (req, res, next) => {
    req.apiVersion = version;
    res.set('API-Version', version);
    next();
  };
};

/**
 * Content-Type validation for API endpoints
 */
const requireJson = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Content-Type must be application/json for this endpoint.'
      });
    }
  }
  next();
};

/**
 * Request size limiting
 */
const limitRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'));
    const maxBytes = parseSize(maxSize);
    
    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size exceeds ${maxSize} limit.`
      });
    }
    
    next();
  };
};

// Helper function to parse size strings
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b?)$/);
  if (!match) return 0;
  
  return parseFloat(match[1]) * (units[match[2]] || 1);
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireScopes,
  requireAdmin,
  requireDeveloper,
  requireOwnership,
  oauthCors,
  apiVersion,
  requireJson,
  limitRequestSize
}; 
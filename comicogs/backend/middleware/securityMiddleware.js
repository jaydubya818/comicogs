// ===============================================
// COMPREHENSIVE SECURITY MIDDLEWARE
// Implementing OWASP security best practices
// ===============================================

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const cors = require('cors');

// ==========================================
// SECURITY CONFIGURATION
// ==========================================

/**
 * CORS Configuration
 * Environment-based CORS settings
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // In production, be strict about origins
    if (process.env.NODE_ENV === 'production' && !allowedOrigins.includes(origin)) {
      const msg = `The CORS policy for this application doesn't allow access from origin ${origin}`;
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Requested-With'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // Cache preflight response for 24 hours
};

/**
 * Helmet Configuration
 * Security headers configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    reportOnly: process.env.NODE_ENV !== 'production'
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Rate Limiting Configuration
 * Enhanced rate limiting for different endpoint types
 */
const rateLimitConfigs = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', req, {
        limit: 1000,
        window: '15 minutes'
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP. Please try again later.',
        retryAfter: res.get('Retry-After'),
        timestamp: new Date().toISOString()
      });
    }
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Very strict for auth
    message: {
      error: 'Authentication rate limit exceeded',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false, // Count failed requests
    handler: (req, res) => {
      logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', req, {
        limit: 20,
        window: '15 minutes'
      });
      
      res.status(429).json({
        error: 'Authentication rate limit exceeded',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: res.get('Retry-After'),
        timestamp: new Date().toISOString()
      });
    }
  }),

  // Rate limiting for search endpoints
  search: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Search can be expensive
    message: {
      error: 'Search rate limit exceeded',
      message: 'Too many search requests. Please try again later.',
      retryAfter: '15 minutes'
    }
  }),

  // Very strict rate limiting for bulk operations
  bulk: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Very few bulk operations
    message: {
      error: 'Bulk operation rate limit exceeded',
      message: 'Too many bulk operations. Please try again in 1 hour.',
      retryAfter: '1 hour'
    }
  })
};

// ==========================================
// INPUT VALIDATION AND SANITIZATION
// ==========================================

/**
 * Common validation rules
 */
const validationRules = {
  // User input validation
  username: body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .escape(),

  email: body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long'),

  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  // Comic data validation
  comicTitle: body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Comic title must be between 1 and 255 characters')
    .escape(),

  issueNumber: body('issue_number')
    .optional()
    .isNumeric()
    .withMessage('Issue number must be numeric')
    .custom((value) => {
      if (value < 0 || value > 99999) {
        throw new Error('Issue number must be between 0 and 99999');
      }
      return true;
    }),

  price: body('price')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Price must be a valid amount')
    .custom((value) => {
      // Ensure only 2 decimal places
      if (value && !(/^\d+(\.\d{1,2})?$/.test(value.toString()))) {
        throw new Error('Price can have at most 2 decimal places');
      }
      return true;
    }),

  // ID validation
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
    .toInt(),

  // Search query validation
  searchQuery: query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer between 1 and 10000')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
};

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logSecurityEvent('VALIDATION_ERROR', req, {
      errors: errors.array()
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// ==========================================
// SQL INJECTION PREVENTION
// ==========================================

/**
 * SQL Injection Detection Middleware
 * Detects potential SQL injection patterns in request data
 */
const sqlInjectionPrevention = (req, res, next) => {
  const sqlPatterns = [
    /('|(\\')|(;)|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b))/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(UNION\s+(ALL\s+)?SELECT)/gi,
    /(\/\*|\*\/|--|\#)/g,
    /(\bxp_\w+)/gi
  ];

  const checkForSQLInjection = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          logSecurityEvent('SQL_INJECTION_ATTEMPT', req, {
            pattern: pattern.toString(),
            value: obj,
            path: path
          });
          
          return res.status(400).json({
            error: 'Invalid input detected',
            message: 'Request contains potentially harmful content',
            timestamp: new Date().toISOString()
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const result = checkForSQLInjection(value, path ? `${path}.${key}` : key);
        if (result) return result;
      }
    }
  };

  // Check request body, query, and params
  checkForSQLInjection(req.body, 'body');
  checkForSQLInjection(req.query, 'query');
  checkForSQLInjection(req.params, 'params');

  next();
};

// ==========================================
// SECURITY LOGGING AND MONITORING
// ==========================================

/**
 * Security Event Logger
 * Logs security-related events for monitoring
 */
const logSecurityEvent = (eventType, req, additionalData = {}) => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    method: req.method,
    url: req.originalUrl,
    user: req.user ? req.user.id : null,
    ...additionalData
  };

  // In production, this should go to a proper logging service
  console.warn(`[SECURITY] ${eventType}:`, JSON.stringify(securityEvent, null, 2));

  // You could integrate with external logging services here
  // Example: send to logging service, security monitoring tools, etc.
};

/**
 * Security Headers Middleware
 * Adds additional security headers beyond Helmet
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Request Sanitization Middleware
 * Sanitizes request data to prevent XSS and other attacks
 */
const sanitizeRequest = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove null bytes
    str = str.replace(/\0/g, '');
    
    // Remove suspicious patterns
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');
    
    return str;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request data
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

// ==========================================
// EXPORTED MIDDLEWARE
// ==========================================

module.exports = {
  // Core security middleware
  helmet: helmet(helmetConfig),
  cors: cors(corsOptions),
  
  // Rate limiting
  rateLimits: rateLimitConfigs,
  
  // Input validation
  validation: {
    rules: validationRules,
    handleErrors: handleValidationErrors
  },
  
  // Security middleware functions
  sqlInjectionPrevention,
  additionalSecurityHeaders,
  sanitizeRequest,
  logSecurityEvent,
  
  // Configuration objects for reference
  config: {
    cors: corsOptions,
    helmet: helmetConfig,
    rateLimits: rateLimitConfigs
  }
};
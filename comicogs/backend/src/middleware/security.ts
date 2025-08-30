import type { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import slowDown from 'express-slow-down'

// Security headers middleware using helmet
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Tailwind
        "https://fonts.googleapis.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for Next.js dev mode
        "https://js.stripe.com",
        "https://maps.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Allow images from any HTTPS source
        "http://localhost:*", // Allow local development images
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://maps.googleapis.com",
        "https://o1234567.ingest.sentry.io", // Sentry
        process.env.NODE_ENV === 'development' ? "http://localhost:*" : "",
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : "",
      ].filter(Boolean),
      frameSrc: [
        "https://js.stripe.com",
        "https://hooks.stripe.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: { action: 'deny' },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' },

  // X-XSS-Protection (legacy, but still useful)
  xssFilter: true,
})

// CORS configuration
export function corsConfig(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'https://comicogs.com',
    'https://www.comicogs.com',
    'https://admin.comicogs.com',
  ].filter(Boolean)

  const origin = req.headers.origin
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0])
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    )
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-API-Key'
    )
    res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).send()
  }

  next()
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Validate request size
  const contentLength = parseInt(req.headers['content-length'] || '0', 10)
  const maxSize = req.path.includes('/upload') ? 50 * 1024 * 1024 : 1024 * 1024 // 50MB for uploads, 1MB for others

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Payload too large',
      code: 'PAYLOAD_TOO_LARGE',
      maxSize
    })
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type']
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required',
        code: 'MISSING_CONTENT_TYPE'
      })
    }

    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ]

    const isAllowed = allowedTypes.some(type => contentType.startsWith(type))
    
    if (!isAllowed) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        code: 'UNSUPPORTED_MEDIA_TYPE',
        allowedTypes
      })
    }
  }

  next()
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      req.query[key] = value
        .replace(/[<>\"']/g, '') // Remove HTML/script characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
    }
  }

  // Sanitize body for JSON requests
  if (req.headers['content-type']?.includes('application/json') && req.body) {
    req.body = sanitizeObject(req.body)
  }

  next()
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/[<>]/g, '') // Remove HTML characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys too
      const cleanKey = key.replace(/[<>\"']/g, '').trim()
      if (cleanKey && cleanKey.length < 100) { // Reasonable key length limit
        sanitized[cleanKey] = sanitizeObject(value)
      }
    }
    return sanitized
  }
  
  return obj
}

// Request logging for security monitoring
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  
  // Log potentially dangerous requests
  const suspiciousPatterns = [
    /\.\./,
    /\/etc\/passwd/,
    /\/proc\/version/,
    /<script/i,
    /union.*select/i,
    /exec\s*\(/i,
  ]

  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fullUrl) || 
    pattern.test(JSON.stringify(req.body || {})) ||
    pattern.test(JSON.stringify(req.query))
  )

  if (isSuspicious) {
    console.warn('Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query
    })
  }

  // Override res.end to capture response details
  const originalEnd = res.end
  res.end = function(this: Response, ...args: any[]) {
    const duration = Date.now() - startTime
    
    // Log slow requests (potential DoS attempts)
    if (duration > 5000) {
      console.warn('Slow request detected:', {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      })
    }

    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Authentication/Authorization failure:', {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      })
    }

    return originalEnd.apply(this, args)
  }

  next()
}

// API key validation middleware
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  // Skip API key validation for certain paths
  const skipPaths = ['/health', '/metrics', '/_next', '/api/stripe/webhook']
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next()
  }

  const apiKey = req.headers['x-api-key'] as string
  const validApiKeys = process.env.API_KEYS?.split(',') || []

  if (req.path.startsWith('/api/') && validApiKeys.length > 0) {
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid or missing API key',
        code: 'INVALID_API_KEY'
      })
    }
  }

  next()
}

// Rate limiting with express-rate-limit (alternative implementation)
export const createExpressRateLimit = (options: {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || {
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    keyGenerator: (req) => `${req.ip}-${req.user?.id || 'anonymous'}`,
    skip: (req) => {
      // Skip rate limiting for health checks and metrics
      return req.path === '/health' || req.path === '/metrics'
    }
  })
}

// Slow down middleware for gradual rate limiting
export const createSlowDown = (options: {
  windowMs: number
  delayAfter: number
  delayMs: number
  maxDelayMs?: number
}) => {
  return slowDown({
    windowMs: options.windowMs,
    delayAfter: options.delayAfter,
    delayMs: options.delayMs,
    maxDelayMs: options.maxDelayMs || 1000,
    keyGenerator: (req) => `${req.ip}-${req.user?.id || 'anonymous'}`,
    skip: (req) => {
      return req.path === '/health' || req.path === '/metrics'
    }
  })
}

// Security middleware stack
export function createSecurityStack() {
  return [
    securityHeaders,
    corsConfig,
    validateRequest,
    sanitizeInput,
    securityLogger,
    validateApiKey,
  ]
}
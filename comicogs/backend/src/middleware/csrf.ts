import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Extend Request type to include session
declare global {
  namespace Express {
    interface Request {
      session?: {
        csrf?: string;
        [key: string]: any;
      };
    }
    interface Response {
      locals: {
        csrf?: string;
        [key: string]: any;
      };
    }
  }
}

export function csrfToken(req: Request, res: Response, next: NextFunction) {
  // For demo purposes, we'll use a simple in-memory session simulation
  // In production, use express-session with Redis store
  if (!req.session) {
    req.session = {};
  }
  
  if (!req.session.csrf) {
    req.session.csrf = crypto.randomUUID();
  }
  
  res.locals.csrf = req.session.csrf;
  next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests and health checks
  if (req.method === "GET" || req.method === "HEAD" || req.path === "/health") {
    return next();
  }

  // Skip CSRF for API endpoints that use other auth methods (like Stripe webhooks)
  if (req.path.startsWith("/api/stripe/webhook")) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body?._csrf;
  
  if (!req.session?.csrf) {
    return res.status(403).json({ 
      error: "CSRF token missing from session",
      code: "CSRF_SESSION_MISSING" 
    });
  }
  
  if (token !== req.session.csrf) {
    return res.status(403).json({ 
      error: "Invalid CSRF token",
      code: "CSRF_TOKEN_INVALID" 
    });
  }
  
  next();
}

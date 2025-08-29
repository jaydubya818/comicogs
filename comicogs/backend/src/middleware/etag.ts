import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * ETag middleware for conditional GET requests
 * Generates ETags for JSON responses and handles If-None-Match headers
 */
export function withEtag(req: Request, res: Response, next: NextFunction) {
  // Store the original json method
  const originalJson = res.json.bind(res);
  
  // Override the json method to add ETag handling
  res.json = function(body: any) {
    // Convert body to string for ETag generation
    const bodyString = typeof body === "string" ? body : JSON.stringify(body);
    
    // Generate weak ETag using SHA-256 hash
    const hash = crypto.createHash("sha256").update(bodyString).digest("hex");
    const etag = `W/"${hash}"`;
    
    // Check if client has matching ETag
    const clientEtag = req.headers["if-none-match"];
    if (clientEtag === etag) {
      // Resource hasn't changed, return 304 Not Modified
      res.status(304);
      res.removeHeader("Content-Type");
      res.removeHeader("Content-Length");
      return res.end();
    }
    
    // Set caching headers
    res.setHeader("ETag", etag);
    
    // Set cache control based on the endpoint
    const path = req.path;
    if (path.includes("/api/listings") || path.includes("/api/comics")) {
      // Cache API responses for 60 seconds
      res.setHeader("Cache-Control", "public, max-age=60, must-revalidate");
    } else if (path.includes("/api/users") || path.includes("/api/orders")) {
      // Don't cache user-specific data
      res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
    } else {
      // Default caching for other endpoints
      res.setHeader("Cache-Control", "public, max-age=30");
    }
    
    // Set Vary header to handle different Accept headers
    res.setHeader("Vary", "Accept, Accept-Encoding");
    
    // Call original json method
    return originalJson(body);
  };
  
  next();
}

/**
 * Generate ETag for static content (images, etc.)
 */
export function generateEtag(content: Buffer | string): string {
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `"${hash}"`;
}

/**
 * Check if request matches ETag
 */
export function matchesEtag(req: Request, etag: string): boolean {
  const clientEtag = req.headers["if-none-match"];
  return clientEtag === etag;
}

/**
 * Middleware specifically for static file serving with ETag
 */
export function staticEtag(req: Request, res: Response, next: NextFunction) {
  // Store original send method
  const originalSend = res.send.bind(res);
  
  res.send = function(body: any) {
    if (body instanceof Buffer || typeof body === "string") {
      const etag = generateEtag(body);
      
      if (matchesEtag(req, etag)) {
        res.status(304);
        return res.end();
      }
      
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year for static assets
    }
    
    return originalSend(body);
  };
  
  next();
}

/**
 * Conditional request helpers
 */
export const conditionalHelpers = {
  /**
   * Check if resource has been modified since given date
   */
  isModifiedSince(req: Request, lastModified: Date): boolean {
    const ifModifiedSince = req.headers["if-modified-since"];
    if (!ifModifiedSince) return true;
    
    try {
      const clientDate = new Date(ifModifiedSince);
      return lastModified > clientDate;
    } catch {
      return true;
    }
  },
  
  /**
   * Set Last-Modified header
   */
  setLastModified(res: Response, date: Date): void {
    res.setHeader("Last-Modified", date.toUTCString());
  },
  
  /**
   * Handle conditional GET with both ETag and Last-Modified
   */
  handleConditionalGet(req: Request, res: Response, etag: string, lastModified: Date): boolean {
    const clientEtag = req.headers["if-none-match"];
    const ifModifiedSince = req.headers["if-modified-since"];
    
    let notModified = false;
    
    // If ETag matches, resource is not modified
    if (clientEtag && clientEtag === etag) {
      notModified = true;
    }
    
    // If no ETag but If-Modified-Since header exists, check date
    if (!notModified && ifModifiedSince && !clientEtag) {
      try {
        const clientDate = new Date(ifModifiedSince);
        notModified = lastModified <= clientDate;
      } catch {
        // Invalid date, treat as modified
      }
    }
    
    if (notModified) {
      res.status(304).end();
      return true;
    }
    
    // Set headers for future conditional requests
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", lastModified.toUTCString());
    
    return false;
  }
};
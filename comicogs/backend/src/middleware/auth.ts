import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role: Role;
      };
    }
  }
}

/**
 * Basic authentication middleware
 * For now, this simulates auth by using email from headers
 * In production, this would validate JWT tokens or session cookies
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For demo purposes, we'll use a header to simulate authentication
  // In production, you'd validate JWT tokens or session cookies here
  const userEmail = req.headers['x-user-email'] as string;
  
  if (!userEmail) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required. Please provide x-user-email header for demo.' 
    });
  }

  // Look up user by email
  prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  })
  .then(user => {
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  })
  .catch(error => {
    req.logger?.error({ error, userEmail }, 'Auth middleware error');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to authenticate user' 
    });
  });
}

/**
 * Role-based authorization middleware factory
 * @param allowedRoles - Array of roles that can access the endpoint
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      req.logger?.warn({ 
        userId: req.user.id, 
        userRole: req.user.role, 
        allowedRoles,
        endpoint: req.path 
      }, 'Access denied - insufficient permissions');

      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        upgrade: req.user.role === 'user' ? {
          message: 'Upgrade to seller account to list items for sale',
          action: 'contact_admin'
        } : undefined
      });
    }

    next();
  };
}

/**
 * Middleware to check if user owns a resource
 * @param getResourceOwnerId - Function to extract owner ID from request
 */
export function requireOwnership(getResourceOwnerId: (req: Request) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        return res.status(404).json({ 
          error: 'Not found',
          message: 'Resource not found' 
        });
      }

      // Allow access if user owns the resource OR user is admin
      if (req.user.id !== ownerId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only access your own resources' 
        });
      }

      next();
    } catch (error) {
      req.logger?.error({ error, userId: req.user.id }, 'Ownership check error');
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify ownership' 
      });
    }
  };
}

/**
 * Optional auth middleware - sets user if authenticated but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const userEmail = req.headers['x-user-email'] as string;
  
  if (!userEmail) {
    return next(); // No auth required, continue
  }

  // Look up user by email
  prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  })
  .then(user => {
    if (user) {
      req.user = user;
    }
    next();
  })
  .catch(error => {
    req.logger?.error({ error, userEmail }, 'Optional auth error');
    next(); // Continue even if auth fails
  });
}

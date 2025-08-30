import type { Request, Response, NextFunction } from 'express'

// User roles and permissions
export enum UserRole {
  USER = 'user',
  SELLER = 'seller', 
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // User permissions
  READ_PROFILE = 'read:profile',
  UPDATE_PROFILE = 'update:profile',
  DELETE_PROFILE = 'delete:profile',
  
  // Collection permissions
  READ_COLLECTION = 'read:collection',
  UPDATE_COLLECTION = 'update:collection',
  DELETE_COLLECTION = 'delete:collection',
  
  // Marketplace permissions
  READ_LISTINGS = 'read:listings',
  CREATE_LISTING = 'create:listing',
  UPDATE_LISTING = 'update:listing',
  DELETE_LISTING = 'delete:listing',
  
  // Order permissions
  READ_ORDERS = 'read:orders',
  UPDATE_ORDER_STATUS = 'update:order_status',
  REFUND_ORDER = 'refund:order',
  
  // Admin permissions
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Moderator permissions
  MODERATE_CONTENT = 'moderate:content',
  BAN_USERS = 'ban:users',
  REVIEW_REPORTS = 'review:reports',
  
  // System permissions
  READ_ANALYTICS = 'read:analytics',
  MANAGE_SYSTEM = 'manage:system',
  ACCESS_LOGS = 'access:logs',
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_COLLECTION,
    Permission.UPDATE_COLLECTION,
    Permission.DELETE_COLLECTION,
    Permission.READ_LISTINGS,
    Permission.READ_ORDERS,
  ],
  
  [UserRole.SELLER]: [
    // Inherits all user permissions
    ...ROLE_PERMISSIONS[UserRole.USER] || [],
    Permission.CREATE_LISTING,
    Permission.UPDATE_LISTING,
    Permission.DELETE_LISTING,
    Permission.UPDATE_ORDER_STATUS,
  ],
  
  [UserRole.MODERATOR]: [
    // Inherits seller permissions
    ...ROLE_PERMISSIONS[UserRole.SELLER] || [],
    Permission.MODERATE_CONTENT,
    Permission.BAN_USERS,
    Permission.REVIEW_REPORTS,
    Permission.READ_USERS,
  ],
  
  [UserRole.ADMIN]: [
    // Inherits moderator permissions
    ...ROLE_PERMISSIONS[UserRole.MODERATOR] || [],
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.REFUND_ORDER,
    Permission.READ_ANALYTICS,
    Permission.ACCESS_LOGS,
  ],
  
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(Permission),
  ],
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
        permissions?: Permission[]
        isActive?: boolean
        emailVerified?: boolean
      }
    }
  }
}

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Check if user has all specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  // Check if user account is active
  if (req.user.isActive === false) {
    return res.status(403).json({
      error: 'Account is inactive',
      code: 'ACCOUNT_INACTIVE'
    })
  }

  next()
}

// Middleware to require email verification
export function requireEmailVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    })
  }

  next()
}

// Middleware to require specific role
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'Insufficient privileges',
        code: 'INSUFFICIENT_PRIVILEGES',
        required: role,
        current: req.user.role
      })
    }

    next()
  }
}

// Middleware to require minimum role level
export function requireMinRole(minRole: UserRole) {
  const roleHierarchy = [
    UserRole.USER,
    UserRole.SELLER, 
    UserRole.MODERATOR,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ]

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const userRoleIndex = roleHierarchy.indexOf(req.user.role)
    const minRoleIndex = roleHierarchy.indexOf(minRole)

    if (userRoleIndex < minRoleIndex) {
      return res.status(403).json({
        error: 'Insufficient privileges',
        code: 'INSUFFICIENT_PRIVILEGES',
        required: minRole,
        current: req.user.role
      })
    }

    next()
  }
}

// Middleware to require specific permission
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        userRole: req.user.role
      })
    }

    next()
  }
}

// Middleware to require any of the specified permissions
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: req.user.role
      })
    }

    next()
  }
}

// Middleware to require all specified permissions
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        userRole: req.user.role
      })
    }

    next()
  }
}

// Middleware for resource ownership check
export function requireOwnership(resourceIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      })
    }

    const resourceId = req.params[resourceIdParam]
    const userId = req.user.id

    // Allow admins to access any resource
    if (hasPermission(req.user.role, Permission.UPDATE_USERS)) {
      return next()
    }

    // Check ownership (this would typically query the database)
    // For now, we'll do a simple check
    if (resourceId !== userId) {
      return res.status(403).json({
        error: 'Access denied - resource ownership required',
        code: 'OWNERSHIP_REQUIRED'
      })
    }

    next()
  }
}

// Middleware for conditional authorization
export function conditionalAuth(condition: (req: Request) => boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return requireAuth(req, res, next)
    }
    next()
  }
}

// Admin-only middleware
export const requireAdmin = requireMinRole(UserRole.ADMIN)

// Seller or higher middleware
export const requireSeller = requireMinRole(UserRole.SELLER)

// Moderator or higher middleware  
export const requireModerator = requireMinRole(UserRole.MODERATOR)

// Super admin only middleware
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN)

// Helper function to get user permissions
export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Middleware to add permissions to request
export function addPermissionsToRequest(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    req.user.permissions = getUserPermissions(req.user.role)
  }
  next()
}

// Feature flag middleware
export function requireFeatureFlag(flagName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // This would integrate with your feature flag service
    const featureFlags = process.env.FEATURE_FLAGS?.split(',') || []
    
    if (!featureFlags.includes(flagName)) {
      return res.status(404).json({
        error: 'Feature not available',
        code: 'FEATURE_DISABLED'
      })
    }

    next()
  }
}

// Rate limiting based on user role
export function roleBasedRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    // Apply stricter limits for unauthenticated users
    req.rateLimit = { max: 100, windowMs: 15 * 60 * 1000 }
  } else {
    // Different limits based on role
    switch (req.user.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        req.rateLimit = { max: 10000, windowMs: 15 * 60 * 1000 }
        break
      case UserRole.MODERATOR:
        req.rateLimit = { max: 5000, windowMs: 15 * 60 * 1000 }
        break
      case UserRole.SELLER:
        req.rateLimit = { max: 2000, windowMs: 15 * 60 * 1000 }
        break
      default:
        req.rateLimit = { max: 1000, windowMs: 15 * 60 * 1000 }
    }
  }

  next()
}

declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        max: number
        windowMs: number
      }
    }
  }
}
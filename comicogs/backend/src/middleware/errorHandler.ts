import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { notifications } from '../services/notify';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.requestId || 'unknown';
  const requestLogger = req.logger || logger;

  // Handle different types of errors
  if (err instanceof ZodError) {
    requestLogger.warn({ error: err.issues, requestId }, 'Validation error');
    return res.status(400).json({
      error: 'Validation failed',
      message: err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
      requestId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    requestLogger.warn({ error: err.message, code: err.code, requestId }, 'Database error');
    
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Conflict',
          message: 'A record with this data already exists',
          requestId,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Not found',
          message: 'The requested record was not found',
          requestId,
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: 'An error occurred while processing your request',
          requestId,
        });
    }
  }

  if (err instanceof AppError) {
    requestLogger.warn({ error: err.message, statusCode: err.statusCode, requestId }, 'Application error');
    return res.status(err.statusCode).json({
      error: err.message,
      requestId,
    });
  }

  // Log unexpected errors
  requestLogger.error({ error: err.message, stack: err.stack, requestId }, 'Unexpected error');
  
  // Send notification for 5xx errors
  if (res.statusCode >= 500) {
    notifications.serverError(err, requestId, req.method, req.url).catch(() => {
      // Fail silently - don't let notification errors break the response
    });
  }
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal server error';

  return res.status(500).json({
    error: 'Internal server error',
    message,
    requestId,
  });
};

// Async error wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

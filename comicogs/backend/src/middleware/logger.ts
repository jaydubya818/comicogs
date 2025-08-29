import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  }),
});

// Extend Request interface to include logger and requestId
declare global {
  namespace Express {
    interface Request {
      logger: typeof logger;
      requestId: string;
    }
  }
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  
  // Add requestId and logger to request
  req.requestId = requestId;
  req.logger = logger.child({ requestId });
  
  // Add requestId to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request
  req.logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  }, 'Request started');
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(this: Response, chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    req.logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');
    
    originalEnd.call(this, chunk, encoding);
  } as any;
  
  next();
};

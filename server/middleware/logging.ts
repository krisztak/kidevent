import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'kidevent-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        })
      ),
    }),
  ],
});

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function(data) {
    res.send = originalSend;
    const responseTime = Date.now() - start;
    
    // Log the request
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime,
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id'] || 'unknown',
    };

    // Log different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

// Security event logger
export const logSecurityEvent = (event: string, details: any, req?: Request) => {
  logger.warn('Security event', {
    event,
    details,
    ip: req?.ip || req?.socket.remoteAddress,
    userAgent: req?.get('User-Agent'),
    userId: (req as any)?.user?.id,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logger
export const logDatabaseOperation = (operation: string, table: string, details?: any) => {
  logger.debug('Database operation', {
    operation,
    table,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Authentication event logger
export const logAuthEvent = (event: 'login' | 'logout' | 'signup' | 'failed_login', userId?: string, details?: any) => {
  logger.info('Authentication event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
};
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config/environment";
import { 
  securityHeaders, 
  corsConfig, 
  apiLimiter, 
  sanitizeInput,
  requestSizeLimiter 
} from "./middleware/security";
import { requestLogger, logger, logSecurityEvent } from "./middleware/logging";
import { healthHandler, livenessHandler, readinessHandler } from "./middleware/health";

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware (order is important)
app.use(securityHeaders);
app.use(corsConfig);
app.use(requestSizeLimiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Logging middleware
app.use(requestLogger);

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Health check endpoints (before other routes)
app.get('/api/health', healthHandler);
app.get('/api/health/live', livenessHandler);
app.get('/api/health/ready', readinessHandler);

// Legacy logging middleware (keeping for compatibility)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error
    logger.error('Request error', {
      error: message,
      stack: err.stack,
      statusCode: status,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    });

    // Log security events for authentication/authorization errors
    if (status === 401 || status === 403) {
      logSecurityEvent('access_denied', {
        statusCode: status,
        message,
        endpoint: req.originalUrl,
      }, req);
    }

    res.status(status).json({ 
      message,
      ...(config.server.environment === 'development' && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (config.server.environment === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.server.port;
  server.listen({
    port,
    host: config.server.host,
    reusePort: true,
  }, () => {
    logger.info(`🚀 Server running on port ${port}`, {
      port,
      environment: config.server.environment,
      host: config.server.host,
    });
    log(`serving on port ${port}`);
  });
})();

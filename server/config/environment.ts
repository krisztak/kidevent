import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Server
  PORT: z.coerce.number().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.coerce.number().min(1000).default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  
  // Optional OAuth
  REPL_ID: z.string().optional(),
  ISSUER_URL: z.string().url().optional(),
  REPLIT_DOMAINS: z.string().optional(),
  
  // Optional Redis
  REDIS_URL: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

// Validate and parse environment variables
export function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Environment configuration
export const env = validateEnvironment();

// Configuration object
export const config = {
  database: {
    url: env.DATABASE_URL,
    maxConnections: 20,
    connectionTimeout: 60000,
  },
  server: {
    port: env.PORT,
    host: '0.0.0.0',
    environment: env.NODE_ENV,
  },
  security: {
    sessionSecret: env.SESSION_SECRET,
    corsOrigins: env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    rateLimitMax: env.RATE_LIMIT_MAX,
  },
  oauth: {
    replId: env.REPL_ID,
    issuerUrl: env.ISSUER_URL,
    replitDomains: env.REPLIT_DOMAINS,
  },
  redis: {
    url: env.REDIS_URL,
  },
  features: {
    emailNotifications: true,
    fileUploads: true,
    analytics: false,
  },
} as const;
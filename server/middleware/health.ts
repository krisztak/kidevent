import { Request, Response } from 'express';
import { db } from '../db';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy';
  details?: any;
  responseTime?: number;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
}

// Database health check
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await db.execute('SELECT 1 as health_check');
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
    };
  }
}

// Memory health check
function checkMemory(): HealthCheckResult {
  const memUsage = process.memoryUsage();
  const memoryUsagePercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  return {
    name: 'memory',
    status: memoryUsagePercentage < 90 ? 'healthy' : 'unhealthy',
    details: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      usagePercentage: `${memoryUsagePercentage.toFixed(2)}%`,
    },
  };
}

// Disk space health check
function checkDiskSpace(): HealthCheckResult {
  // This is a simplified check - in production you'd want to check actual disk space
  return {
    name: 'disk',
    status: 'healthy',
    details: {
      message: 'Disk space check not implemented - would check available disk space in production'
    },
  };
}

// Main health check function
export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkDiskSpace()),
  ]);

  const healthResults: HealthCheckResult[] = checks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const checkNames = ['database', 'memory', 'disk'];
      return {
        name: checkNames[index],
        status: 'unhealthy',
        details: result.reason?.message || 'Check failed',
      };
    }
  });

  const overallStatus = healthResults.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : 'unhealthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    checks: healthResults,
  };
}

// Health endpoint handler
export async function healthHandler(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Liveness probe (simpler check for container orchestration)
export function livenessHandler(req: Request, res: Response): void {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
}

// Readiness probe (check if app is ready to receive requests)
export async function readinessHandler(req: Request, res: Response): Promise<void> {
  try {
    await checkDatabase();
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
/**
 * Uptime monitoring utility for Moai app
 * Tracks service availability and performance metrics
 */

interface UptimeMetrics {
  serviceName: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  timestamp: string;
  errorMessage?: string;
}

interface HealthCheckConfig {
  url: string;
  timeout: number;
  expectedStatus?: number;
  expectedContent?: string;
}

export class UptimeMonitor {
  private static metrics: UptimeMetrics[] = [];
  private static maxMetricsHistory = 1000;

  /**
   * Perform HTTP health check on a service
   */
  static async checkHttpService(
    serviceName: string, 
    config: HealthCheckConfig
  ): Promise<UptimeMetrics> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(config.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Moai-Uptime-Monitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const expectedStatus = config.expectedStatus || 200;
      
      let status: 'up' | 'down' | 'degraded' = 'up';
      let errorMessage: string | undefined;

      // Check response status
      if (response.status !== expectedStatus) {
        status = 'down';
        errorMessage = `Expected status ${expectedStatus}, got ${response.status}`;
      }

      // Check response time (consider degraded if > 10 seconds)
      else if (responseTime > 10000) {
        status = 'degraded';
        errorMessage = `Slow response time: ${responseTime}ms`;
      }

      // Check content if specified
      else if (config.expectedContent) {
        const body = await response.text();
        if (!body.includes(config.expectedContent)) {
          status = 'down';
          errorMessage = `Expected content not found: ${config.expectedContent}`;
        }
      }

      const metrics: UptimeMetrics = {
        serviceName,
        status,
        responseTime,
        timestamp: new Date().toISOString(),
        errorMessage
      };

      this.recordMetrics(metrics);
      return metrics;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const metrics: UptimeMetrics = {
        serviceName,
        status: 'down',
        responseTime,
        timestamp: new Date().toISOString(),
        errorMessage
      };

      this.recordMetrics(metrics);
      return metrics;
    }
  }

  /**
   * Check database connectivity
   */
  static async checkDatabase(): Promise<UptimeMetrics> {
    const startTime = Date.now();
    
    try {
      // Import Firebase dynamically to avoid SSR issues
      const { db } = await import('@/lib/firebase/client');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const testDoc = await getDoc(doc(db, 'health', 'test'));
      const responseTime = Date.now() - startTime;

      let status: 'up' | 'down' | 'degraded' = 'up';
      let errorMessage: string | undefined;

      if (responseTime > 5000) {
        status = 'degraded';
        errorMessage = `Slow database response: ${responseTime}ms`;
      }

      const metrics: UptimeMetrics = {
        serviceName: 'firebase-firestore',
        status,
        responseTime,
        timestamp: new Date().toISOString(),
        errorMessage
      };

      this.recordMetrics(metrics);
      return metrics;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Database connection failed';

      const metrics: UptimeMetrics = {
        serviceName: 'firebase-firestore',
        status: 'down',
        responseTime,
        timestamp: new Date().toISOString(),
        errorMessage
      };

      this.recordMetrics(metrics);
      return metrics;
    }
  }

  /**
   * Check external payment service (MercadoPago)
   */
  static async checkPaymentService(): Promise<UptimeMetrics> {
    return this.checkHttpService('mercadopago', {
      url: 'https://api.mercadopago.com/v1/payment_methods',
      timeout: 10000,
      expectedStatus: 200
    });
  }

  /**
   * Check FCM push notification service
   */
  static async checkNotificationService(): Promise<UptimeMetrics> {
    return this.checkHttpService('firebase-fcm', {
      url: 'https://fcm.googleapis.com/fcm/send',
      timeout: 5000,
      expectedStatus: 400 // FCM returns 400 without auth, but service is up
    });
  }

  /**
   * Perform comprehensive health check on all services
   */
  static async performFullHealthCheck(): Promise<{
    overall: 'up' | 'down' | 'degraded';
    services: UptimeMetrics[];
    summary: {
      upServices: number;
      downServices: number;
      degradedServices: number;
      averageResponseTime: number;
    };
  }> {
    const services = await Promise.all([
      this.checkDatabase(),
      this.checkPaymentService(), 
      this.checkNotificationService(),
      this.checkHttpService('main-app', {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        timeout: 15000
      })
    ]);

    const upServices = services.filter(s => s.status === 'up').length;
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    const averageResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length;

    let overall: 'up' | 'down' | 'degraded' = 'up';
    if (downServices > 0) {
      overall = 'down';
    } else if (degradedServices > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      summary: {
        upServices,
        downServices,
        degradedServices,
        averageResponseTime
      }
    };
  }

  /**
   * Record metrics for analysis
   */
  private static recordMetrics(metrics: UptimeMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log critical events
    if (metrics.status === 'down') {
      console.error(`🚨 Service down: ${metrics.serviceName} - ${metrics.errorMessage}`);
    } else if (metrics.status === 'degraded') {
      console.warn(`⚠️ Service degraded: ${metrics.serviceName} - ${metrics.errorMessage}`);
    }
  }

  /**
   * Get recent metrics for a specific service
   */
  static getServiceMetrics(serviceName: string, lastMinutes: number = 60): UptimeMetrics[] {
    const cutoffTime = new Date(Date.now() - lastMinutes * 60 * 1000);
    
    return this.metrics.filter(m => 
      m.serviceName === serviceName && 
      new Date(m.timestamp) > cutoffTime
    );
  }

  /**
   * Calculate uptime percentage for a service
   */
  static calculateUptime(serviceName: string, lastHours: number = 24): number {
    const metrics = this.getServiceMetrics(serviceName, lastHours * 60);
    
    if (metrics.length === 0) return 100; // No data = assume up
    
    const upCount = metrics.filter(m => m.status === 'up').length;
    return (upCount / metrics.length) * 100;
  }

  /**
   * Get system-wide health summary
   */
  static getHealthSummary(lastHours: number = 24): {
    services: Record<string, {
      uptime: number;
      averageResponseTime: number;
      lastStatus: 'up' | 'down' | 'degraded';
      lastCheck: string;
    }>;
    overall: {
      systemUptime: number;
      totalChecks: number;
      averageResponseTime: number;
    };
  } {
    const cutoffTime = new Date(Date.now() - lastHours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp) > cutoffTime);
    
    const serviceNames = [...new Set(recentMetrics.map(m => m.serviceName))];
    const services: Record<string, any> = {};

    for (const serviceName of serviceNames) {
      const serviceMetrics = recentMetrics.filter(m => m.serviceName === serviceName);
      const upCount = serviceMetrics.filter(m => m.status === 'up').length;
      const avgResponseTime = serviceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / serviceMetrics.length;
      const lastMetric = serviceMetrics[serviceMetrics.length - 1];

      services[serviceName] = {
        uptime: (upCount / serviceMetrics.length) * 100,
        averageResponseTime: Math.round(avgResponseTime),
        lastStatus: lastMetric?.status || 'unknown',
        lastCheck: lastMetric?.timestamp || 'never'
      };
    }

    const totalUpChecks = recentMetrics.filter(m => m.status === 'up').length;
    const systemUptime = recentMetrics.length > 0 ? (totalUpChecks / recentMetrics.length) * 100 : 100;
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
      : 0;

    return {
      services,
      overall: {
        systemUptime,
        totalChecks: recentMetrics.length,
        averageResponseTime: Math.round(avgResponseTime)
      }
    };
  }

  /**
   * Export metrics for external monitoring tools
   */
  static exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.toPrometheusFormat();
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics.slice(-100), // Last 100 metrics
      summary: this.getHealthSummary()
    }, null, 2);
  }

  /**
   * Convert metrics to Prometheus format for external monitoring
   */
  private static toPrometheusFormat(): string {
    const summary = this.getHealthSummary();
    let prometheus = '# HELP moai_service_up Service availability (1 = up, 0 = down)\n';
    prometheus += '# TYPE moai_service_up gauge\n';
    
    for (const [serviceName, data] of Object.entries(summary.services)) {
      const value = data.lastStatus === 'up' ? 1 : 0;
      prometheus += `moai_service_up{service="${serviceName}"} ${value}\n`;
    }
    
    prometheus += '\n# HELP moai_service_response_time_ms Service response time in milliseconds\n';
    prometheus += '# TYPE moai_service_response_time_ms gauge\n';
    
    for (const [serviceName, data] of Object.entries(summary.services)) {
      prometheus += `moai_service_response_time_ms{service="${serviceName}"} ${data.averageResponseTime}\n`;
    }
    
    prometheus += '\n# HELP moai_service_uptime_percent Service uptime percentage\n';
    prometheus += '# TYPE moai_service_uptime_percent gauge\n';
    
    for (const [serviceName, data] of Object.entries(summary.services)) {
      prometheus += `moai_service_uptime_percent{service="${serviceName}"} ${data.uptime}\n`;
    }
    
    return prometheus;
  }
}

/**
 * Auto-monitoring function that can be called periodically
 */
export async function runPeriodicHealthCheck(intervalMinutes: number = 5): Promise<void> {
  console.log('🔍 Starting periodic health check...');
  
  try {
    const healthCheck = await UptimeMonitor.performFullHealthCheck();
    
    if (healthCheck.overall === 'down') {
      console.error('🚨 CRITICAL: System is down!', {
        downServices: healthCheck.summary.downServices,
        services: healthCheck.services.filter(s => s.status === 'down')
      });
    } else if (healthCheck.overall === 'degraded') {
      console.warn('⚠️ WARNING: System is degraded', {
        degradedServices: healthCheck.summary.degradedServices,
        averageResponseTime: healthCheck.summary.averageResponseTime
      });
    } else {
      console.log('✅ All systems operational', {
        averageResponseTime: Math.round(healthCheck.summary.averageResponseTime),
        services: healthCheck.services.length
      });
    }

    // Schedule next check
    setTimeout(() => runPeriodicHealthCheck(intervalMinutes), intervalMinutes * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    // Retry in shorter interval if failed
    setTimeout(() => runPeriodicHealthCheck(intervalMinutes), Math.min(intervalMinutes, 2) * 60 * 1000);
  }
}
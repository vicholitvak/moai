import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: 'ok' | 'degraded' | 'down';
    payment: 'ok' | 'degraded' | 'down';
    notifications: 'ok' | 'degraded' | 'down';
    storage: 'ok' | 'degraded' | 'down';
  };
  performance: {
    responseTime: number;
    uptime: number;
  };
  version: string;
  environment: string;
}

async function checkDatabaseHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Check Firebase configuration presence
    const hasFirebaseConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    );

    if (!hasFirebaseConfig) {
      return 'down';
    }

    // For a basic health check, just verify config is present
    // Actual database connectivity is validated through normal app operations
    return 'ok';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'down';
  }
}

async function checkPaymentHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Simple check for MercadoPago environment variables
    const hasConfig = !!(
      process.env.MERCADOPAGO_ACCESS_TOKEN &&
      process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
    );
    
    if (!hasConfig) {
      return 'down';
    }

    // In production, you might want to make a test API call
    // For now, just check config presence
    return 'ok';
  } catch (error) {
    console.error('Payment health check failed:', error);
    return 'down';
  }
}

async function checkNotificationsHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Check FCM configuration
    const hasConfig = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );
    
    return hasConfig ? 'ok' : 'down';
  } catch (error) {
    console.error('Notifications health check failed:', error);
    return 'down';
  }
}

async function checkStorageHealth(): Promise<'ok' | 'degraded' | 'down'> {
  try {
    // Check Firebase Storage configuration
    const hasConfig = !!(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    );
    
    return hasConfig ? 'ok' : 'down';
  } catch (error) {
    console.error('Storage health check failed:', error);
    return 'down';
  }
}

function getUptimeInSeconds(): number {
  return process.uptime();
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel for better performance
    const [database, payment, notifications, storage] = await Promise.all([
      checkDatabaseHealth(),
      checkPaymentHealth(),
      checkNotificationsHealth(),
      checkStorageHealth()
    ]);

    const responseTime = Date.now() - startTime;
    const services = { database, payment, notifications, storage };

    // Determine overall status
    const hasDown = Object.values(services).includes('down');
    const hasDegraded = Object.values(services).includes('degraded');
    
    let overallStatus: 'ok' | 'degraded' | 'down';
    if (hasDown) {
      overallStatus = 'down';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'ok';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      performance: {
        responseTime,
        uptime: getUptimeInSeconds()
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
      environment: process.env.NODE_ENV ?? 'unknown'
    };

    // Always return 200 for health checks to indicate the service is responding
    // The status field in the JSON indicates the actual health state
    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse: HealthStatus = {
      status: 'down',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        payment: 'down',
        notifications: 'down',
        storage: 'down'
      },
      performance: {
        responseTime: Date.now() - startTime,
        uptime: getUptimeInSeconds()
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
      environment: process.env.NODE_ENV ?? 'unknown'
    };

    // Return 200 to indicate the health endpoint itself is working
    // Status field shows actual service health
    return NextResponse.json(errorResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json'
      }
    });
  }
}
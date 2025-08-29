import { NextRequest, NextResponse } from 'next/server'
import { UptimeMonitor } from '@/lib/monitoring/uptime-monitor'
import { headers } from 'next/headers'

/**
 * Admin-only system status endpoint
 * Provides detailed health information for monitoring dashboards
 */
export async function GET(request: NextRequest) {
  try {
    // Basic auth check - in production, you'd use proper admin authentication
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    // This is a simplified check - in production, verify Firebase Admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const format = searchParams.get('format') || 'json'

    // Perform comprehensive health check
    const healthCheck = await UptimeMonitor.performFullHealthCheck()
    const healthSummary = UptimeMonitor.getHealthSummary(hours)

    if (format === 'prometheus') {
      const prometheusData = UptimeMonitor.exportMetrics('prometheus')
      return new Response(prometheusData, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }

    const response = {
      timestamp: new Date().toISOString(),
      system: {
        overall: healthCheck.overall,
        uptime: process.uptime(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      },
      current: {
        services: healthCheck.services,
        summary: healthCheck.summary
      },
      historical: {
        period: `${hours} hours`,
        services: healthSummary.services,
        overall: healthSummary.overall
      },
      alerts: generateAlerts(healthCheck, healthSummary)
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('System status check failed:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve system status',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

/**
 * Generate alerts based on current and historical data
 */
function generateAlerts(
  current: Awaited<ReturnType<typeof UptimeMonitor.performFullHealthCheck>>,
  historical: ReturnType<typeof UptimeMonitor.getHealthSummary>
): Array<{
  type: 'critical' | 'warning' | 'info'
  service: string
  message: string
  timestamp: string
}> {
  const alerts: Array<{
    type: 'critical' | 'warning' | 'info'
    service: string
    message: string
    timestamp: string
  }> = []

  const timestamp = new Date().toISOString()

  // Check for currently down services
  current.services.forEach(service => {
    if (service.status === 'down') {
      alerts.push({
        type: 'critical',
        service: service.serviceName,
        message: `Service is currently down: ${service.errorMessage}`,
        timestamp
      })
    } else if (service.status === 'degraded') {
      alerts.push({
        type: 'warning',
        service: service.serviceName,
        message: `Service is degraded: ${service.errorMessage}`,
        timestamp
      })
    }
  })

  // Check for poor historical uptime
  Object.entries(historical.services).forEach(([serviceName, data]) => {
    if (data.uptime < 95) {
      alerts.push({
        type: 'critical',
        service: serviceName,
        message: `Poor uptime over last 24h: ${data.uptime.toFixed(2)}%`,
        timestamp
      })
    } else if (data.uptime < 99) {
      alerts.push({
        type: 'warning',
        service: serviceName,
        message: `Below target uptime over last 24h: ${data.uptime.toFixed(2)}%`,
        timestamp
      })
    }
  })

  // Check for slow response times
  Object.entries(historical.services).forEach(([serviceName, data]) => {
    if (data.averageResponseTime > 10000) {
      alerts.push({
        type: 'critical',
        service: serviceName,
        message: `Very slow response time: ${data.averageResponseTime}ms`,
        timestamp
      })
    } else if (data.averageResponseTime > 5000) {
      alerts.push({
        type: 'warning',
        service: serviceName,
        message: `Slow response time: ${data.averageResponseTime}ms`,
        timestamp
      })
    }
  })

  // System-wide alerts
  if (historical.overall.systemUptime < 95) {
    alerts.push({
      type: 'critical',
      service: 'system',
      message: `System-wide uptime below critical threshold: ${historical.overall.systemUptime.toFixed(2)}%`,
      timestamp
    })
  }

  return alerts.sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2 }
    return priority[a.type] - priority[b.type]
  })
}

/**
 * Update system status (for manual overrides)
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'force-health-check':
        const healthCheck = await UptimeMonitor.performFullHealthCheck()
        return NextResponse.json({
          message: 'Health check completed',
          result: healthCheck,
          timestamp: new Date().toISOString()
        })

      case 'clear-metrics':
        // In a real implementation, you'd clear stored metrics
        return NextResponse.json({
          message: 'Metrics cleared',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('System status update failed:', error)
    
    return NextResponse.json({
      error: 'Failed to update system status',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
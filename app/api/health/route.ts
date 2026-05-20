import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`

    const response = {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    }

    logger.request('GET', '/api/health', 200, Date.now() - start)
    return NextResponse.json(response)
  } catch (error) {
    logger.error('Health check failed', error, { path: '/api/health' })

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}

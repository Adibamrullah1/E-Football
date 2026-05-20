import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { seasonSchema } from '@/lib/validations/season'
import { sanitizeObject } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(seasons)
  } catch (error) {
    logger.error('Failed to fetch seasons', error, { path: '/api/seasons' })
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Rate limiting
  const rateLimited = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const data = seasonSchema.parse(sanitized)

    // If setting as active, deactivate all others
    if (data.isActive) {
      await prisma.season.updateMany({
        data: { isActive: false },
      })
    }

    const season = await prisma.season.create({
      data: {
        name: data.name,
        isActive: data.isActive || false,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    })

    logger.audit({
      action: 'CREATE',
      entity: 'Season',
      entityId: season.id,
      userId: (session.user as any)?.id,
      details: { name: season.name, isActive: season.isActive },
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    logger.error('Failed to create season', error, { path: '/api/seasons' })
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}

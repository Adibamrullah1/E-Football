import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { seasonSchema } from '@/lib/validations/season'
import { sanitizeObject } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const data = seasonSchema.parse(sanitized)

    if (data.isActive) {
      // Deactivate all other seasons if this one is set to active
      await prisma.season.updateMany({
        where: { id: { not: params.id } },
        data: { isActive: false },
      })
    }

    const season = await prisma.season.update({
      where: { id: params.id },
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
      },
    })

    logger.audit({
      action: 'UPDATE',
      entity: 'Season',
      entityId: season.id,
      userId: (session.user as any)?.id,
      details: { name: season.name, isActive: season.isActive },
    })

    return NextResponse.json(season)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    logger.error('Failed to update season', error, { path: `/api/seasons/${params.id}` })
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = checkRateLimit(req, { maxRequests: 10, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.season.delete({ where: { id: params.id } })

    logger.audit({
      action: 'DELETE',
      entity: 'Season',
      entityId: params.id,
      userId: (session.user as any)?.id,
    })

    return NextResponse.json({ message: 'Season deleted' })
  } catch (error) {
    logger.error('Failed to delete season', error, { path: `/api/seasons/${params.id}` })
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}

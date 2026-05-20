import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { matchUpdateSchema } from '@/lib/validations/match'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        homePlayer: true,
        awayPlayer: true,
        season: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    logger.error('Failed to fetch match', error, { path: `/api/matches/${params.id}` })
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = matchUpdateSchema.parse(body)

    const match = await prisma.match.update({
      where: { id: params.id },
      data: {
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.status && { status: data.status }),
        ...(data.homePlayerId && { homePlayerId: data.homePlayerId }),
        ...(data.awayPlayerId && { awayPlayerId: data.awayPlayerId }),
      },
      include: { homePlayer: true, awayPlayer: true },
    })

    logger.audit({
      action: 'UPDATE',
      entity: 'Match',
      entityId: match.id,
      userId: (session.user as any)?.id,
      details: { updatedFields: Object.keys(data).filter(k => (data as any)[k] !== undefined) },
    })

    revalidateTag('matches')
    revalidateTag('seasons')
    revalidateTag('players')

    return NextResponse.json(match)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    logger.error('Failed to update match', error, { path: `/api/matches/${params.id}` })
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = checkRateLimit(req, { maxRequests: 10, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.match.delete({ where: { id: params.id } })

    logger.audit({
      action: 'DELETE',
      entity: 'Match',
      entityId: params.id,
      userId: (session.user as any)?.id,
    })

    revalidateTag('matches')
    revalidateTag('seasons')
    revalidateTag('players')

    return NextResponse.json({ message: 'Match deleted' })
  } catch (error) {
    logger.error('Failed to delete match', error, { path: `/api/matches/${params.id}` })
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
  }
}

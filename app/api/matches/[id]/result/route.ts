import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { resultSchema } from '@/lib/validations/match'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = resultSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      // Update match score and status
      const match = await tx.match.update({
        where: { id: params.id },
        data: {
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: 'FINISHED',
          playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
        },
        include: { homePlayer: true, awayPlayer: true },
      })

      return match
    })

    logger.audit({
      action: 'UPDATE',
      entity: 'MatchResult',
      entityId: params.id,
      userId: (session.user as any)?.id,
      details: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        home: result.homePlayer.name,
        away: result.awayPlayer.name,
      },
    })

    // Bersihkan cache publik agar sinkron tanpa delay
    revalidateTag('matches')
    revalidateTag('players')
    revalidateTag('seasons')

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    logger.error('Failed to save result', error, { path: `/api/matches/${params.id}/result` })
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }
}

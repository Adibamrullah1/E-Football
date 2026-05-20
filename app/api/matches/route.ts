import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkEligibility } from '@/lib/services/matchmaking.service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const seasonId = searchParams.get('seasonId')
    const playerId = searchParams.get('playerId')
    const limit = searchParams.get('limit')

    const where: any = {}
    if (status) where.status = status
    if (seasonId) where.seasonId = seasonId
    if (playerId) {
      where.OR = [{ homePlayerId: playerId }, { awayPlayerId: playerId }]
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homePlayer: true,
        awayPlayer: true,
        season: true,
      },
      orderBy: { scheduledAt: 'desc' },
      ...(limit ? { take: parseInt(limit) } : {}),
    })
    return NextResponse.json(matches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // ── Matchmaking Quota Validation ──────────────────────
    const eligibility = await checkEligibility(body.homePlayerId, body.awayPlayerId)
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reasons.join('. '),
          details: eligibility,
        },
        { status: 422 }
      )
    }
    // ─────────────────────────────────────────────────────

    const match = await prisma.match.create({
      data: {
        seasonId: body.seasonId,
        homePlayerId: body.homePlayerId,
        awayPlayerId: body.awayPlayerId,
        scheduledAt: new Date(body.scheduledAt),
        status: 'SCHEDULED',
      },
      include: { homePlayer: true, awayPlayer: true, season: true },
    })

    revalidateTag('matches')
    revalidateTag('seasons')
    revalidateTag('players')

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}

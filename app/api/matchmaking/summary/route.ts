import { NextResponse } from 'next/server'
import { getQuotaSummary } from '@/lib/services/matchmaking.service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const playerId = searchParams.get('playerId') || undefined

    const summary = await getQuotaSummary(playerId)

    return NextResponse.json(summary)
  } catch (error) {
    logger.error('Quota summary failed', error, { path: '/api/matchmaking/summary' })
    return NextResponse.json(
      { error: 'Gagal mengambil quota summary' },
      { status: 500 }
    )
  }
}

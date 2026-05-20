import { NextResponse } from 'next/server'
import { checkEligibility } from '@/lib/services/matchmaking.service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const homePlayerId = searchParams.get('homePlayerId')
    const awayPlayerId = searchParams.get('awayPlayerId')

    if (!homePlayerId || !awayPlayerId) {
      return NextResponse.json(
        { error: 'Parameter homePlayerId dan awayPlayerId wajib diisi' },
        { status: 400 }
      )
    }

    const result = await checkEligibility(homePlayerId, awayPlayerId)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Eligibility check failed', error, { path: '/api/matchmaking/eligibility' })
    return NextResponse.json(
      { error: 'Gagal memeriksa eligibility' },
      { status: 500 }
    )
  }
}

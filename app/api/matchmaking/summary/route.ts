import { NextResponse } from 'next/server'
import { getQuotaSummary } from '@/lib/services/matchmaking.service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const playerId = searchParams.get('playerId') || undefined

    const summary = await getQuotaSummary(playerId)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Quota summary failed:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil quota summary' },
      { status: 500 }
    )
  }
}

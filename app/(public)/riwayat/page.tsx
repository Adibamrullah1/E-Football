import { prisma } from '@/lib/prisma'
import RiwayatClient from '@/components/public/RiwayatClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Riwayat Pertandingan',
  description: 'Riwayat data semua pertandingan Liga eFootball yang sudah selesai',
}

async function getMatches(seasonIdParam?: string) {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: 'desc' }
  })

  let targetSeason = undefined
  if (seasonIdParam) {
    targetSeason = seasons.find(s => s.id === seasonIdParam)
  }
  if (!targetSeason) {
    targetSeason = seasons.find(s => s.isActive) || seasons[0]
  }

  if (!targetSeason) {
    return { finished: [], seasons: [], activeSeasonId: null }
  }

  const finished = await prisma.match.findMany({
    where: { status: 'FINISHED', seasonId: targetSeason.id },
    select: {
      id: true, status: true, homeScore: true, awayScore: true, scheduledAt: true,
      homePlayer: { select: { id: true, name: true, shortName: true } },
      awayPlayer: { select: { id: true, name: true, shortName: true } },
      season: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })
    
  return { finished, seasons, activeSeasonId: targetSeason.id }
}

export default async function RiwayatPage({ searchParams }: { searchParams: { season?: string } }) {
  const { finished, seasons, activeSeasonId } = await getMatches(searchParams.season)
  
  return <RiwayatClient finished={finished} seasons={seasons} currentSeasonId={activeSeasonId} />
}

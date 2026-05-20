import { prisma } from '@/lib/prisma'
import ScheduleClient from '@/components/public/ScheduleClient'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

export const metadata: Metadata = {
  title: 'Jadwal & Hasil Pertandingan',
  description: 'Lihat jadwal dan hasil pertandingan liga eFootball',
}

export const dynamic = 'force-dynamic'

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
    return { matches: [], seasons: [], activeSeasonId: null }
  }

  const matches = await prisma.match.findMany({
    where: { seasonId: targetSeason.id },
    select: {
      id: true, status: true, homeScore: true, awayScore: true, scheduledAt: true,
      homePlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
      awayPlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })
    
  return { matches, seasons, activeSeasonId: targetSeason.id }
}

export default async function JadwalPage({ searchParams }: { searchParams: { season?: string } }) {
  const { matches, seasons, activeSeasonId } = await getMatches(searchParams.season)
  
  return <ScheduleClient matches={matches} seasons={seasons} currentSeasonId={activeSeasonId} />
}

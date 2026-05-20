export const revalidate = 0

import { prisma } from '@/lib/prisma'
import MatchTableClient from '@/components/admin/MatchTableClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Riwayat Pertandingan | Admin',
}

export default async function AdminRiwayatPage({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: 'desc' },
  })

  let targetSeason = undefined
  if (searchParams.season) {
    targetSeason = seasons.find((s) => s.id === searchParams.season)
  }
  if (!targetSeason) {
    targetSeason = seasons.find((s) => s.isActive) || seasons[0]
  }

  if (!targetSeason) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Riwayat Hasil Selesai</h1>
        <p>Belum ada Musim dibuat.</p>
      </div>
    )
  }

  const matches = await prisma.match.findMany({
    where: { seasonId: targetSeason.id, status: 'FINISHED' },
    select: {
      id: true,
      status: true,
      homeScore: true,
      awayScore: true,
      scheduledAt: true,
      homePlayer: { select: { id: true, name: true, shortName: true } },
      awayPlayer: { select: { id: true, name: true, shortName: true } },
      season: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Riwayat Hasil Selesai</h1>
          <p className="text-xs md:text-sm text-muted-foreground mr-1">
            {matches.length} pertandingan selesai di musim ini
          </p>
        </div>
      </div>

      <MatchTableClient matches={matches} seasons={seasons} currentSeasonId={targetSeason.id} hideScheduled={true} />
    </div>
  )
}

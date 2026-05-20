export const revalidate = 0

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import MatchTableClient from '@/components/admin/MatchTableClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Pertandingan | Admin',
}

export default async function AdminPertandinganPage({ searchParams }: { searchParams: { season?: string } }) {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: 'desc' }
  })

  let targetSeason = undefined
  if (searchParams.season) {
    targetSeason = seasons.find(s => s.id === searchParams.season)
  }
  if (!targetSeason) {
    targetSeason = seasons.find(s => s.isActive) || seasons[0]
  }

  if (!targetSeason) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Kelola Pertandingan</h1>
        <p>Belum ada Musim dibuat.</p>
      </div>
    )
  }

  const matches = await prisma.match.findMany({
    where: { seasonId: targetSeason.id },
    select: {
      id: true, status: true, homeScore: true, awayScore: true, scheduledAt: true,
      homePlayer: { select: { id: true, name: true, shortName: true } },
      awayPlayer: { select: { id: true, name: true, shortName: true } },
      season: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const scheduled = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE').length

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Jadwal Pertandingan</h1>
          <p className="text-xs md:text-sm text-muted-foreground mr-1">
            {scheduled} total mendatang untuk musim ini
          </p>
        </div>
        <Link href="/admin/pertandingan/tambah"
          className="px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 flex items-center gap-2 text-sm whitespace-nowrap self-start sm:self-auto">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat</span> Pertandingan
        </Link>
      </div>

      <MatchTableClient matches={matches} seasons={seasons} currentSeasonId={targetSeason.id} hideHistory={true} />
    </div>
  )
}

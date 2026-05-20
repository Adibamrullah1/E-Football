import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PlayerProfileClient from '@/components/public/PlayerProfileClient'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const player = await prisma.player.findUnique({ where: { id: params.id } })
  if (!player) return { title: 'Pemain Tidak Ditemukan' }
  return { title: `${player.name} | Profil Pemain eFootball` }
}

export const dynamic = 'force-dynamic'

async function getPlayerStats(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  })

  if (!player) return null

  // Ambil musim aktif untuk menghitung laga di musim ini saja
  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { startDate: 'desc' }
  })

  if (!activeSeason) {
    return { player, stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, remainingMatches: 0, winRate: 0, form: [] }, scheduledMatches: [], finishedMatches: [] }
  }

  const matches = await prisma.match.findMany({
    where: {
      seasonId: activeSeason.id,
      OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }]
    },
    select: {
      id: true, status: true, homeScore: true, awayScore: true, scheduledAt: true,
      homePlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
      awayPlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
      season: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'desc' } // dari terbaru ke terlama
  })

  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE').reverse() // dari lama ke baru untuk jadwal mendatang
  const finishedMatches = matches.filter(m => m.status === 'FINISHED') // sudah desc

  let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0, points = 0
  let form: string[] = [] // Ambil 5 terakhir

  // Kalkulasi
  // Karena finishedMatches urutannya desc (terakhir dimainkan di awal), kita ambil 5 pertama untuk form, lalu dibalik supaya kiri = paling lama, kanan = terbaru
  finishedMatches.forEach((m, index) => {
    played++
    const isHome = m.homePlayer.id === playerId
    const pScore = isHome ? m.homeScore! : m.awayScore!
    const oScore = isHome ? m.awayScore! : m.homeScore!

    goalsFor += pScore
    goalsAgainst += oScore

    let result = 'D'
    if (pScore > oScore) { won++; points += 3; result = 'W' }
    else if (pScore < oScore) { lost++; result = 'L' }
    else { drawn++; points += 1 }

    if (index < 5) form.push(result)
  })

  form = form.reverse() // Supaya W W D L W bacanya rapi dari kiri ke kanan (kanan paling baru)

  const goalDiff = goalsFor - goalsAgainst
  const remainingMatches = scheduledMatches.length
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0

  return {
    player,
    stats: { played, won, drawn, lost, goalsFor, goalsAgainst, goalDiff, points, remainingMatches, winRate, form },
    scheduledMatches,
    finishedMatches
  }
}

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const data = await getPlayerStats(params.id)

  if (!data) notFound()

  return (
    <PlayerProfileClient 
      player={data.player}
      stats={data.stats}
      scheduledMatches={data.scheduledMatches}
      finishedMatches={data.finishedMatches}
    />
  )
}

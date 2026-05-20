import { prisma } from '@/lib/prisma'
import StandingsTable from '@/components/public/StandingsTable'
import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import SeasonSelector from '@/components/public/SeasonSelector'
import { unstable_cache } from 'next/cache'

export const metadata: Metadata = {
  title: 'Klasemen',
  description: 'Lihat klasemen liga eFootball Mobile terkini.',
}

export const dynamic = 'force-dynamic'

async function getStandings(seasonIdParam?: string) {
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
    return { standings: [], seasonName: '', seasons: [], activeSeasonId: null }
  }

  const [matches, players] = await Promise.all([
    prisma.match.findMany({
      where: { status: 'FINISHED', seasonId: targetSeason.id },
      select: {
        homePlayerId: true, awayPlayerId: true,
        homeScore: true, awayScore: true,
      },
    }),
    prisma.player.findMany({
      select: { id: true, name: true, shortName: true, avatarUrl: true },
    }),
  ])

  const standingsMap = new Map<string, any>()
  players.forEach(player => {
    standingsMap.set(player.id, {
      playerId: player.id, playerName: player.name, shortName: player.shortName, avatarUrl: player.avatarUrl,
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    })
  })

  matches.forEach(match => {
    if (match.homeScore === null || match.awayScore === null) return
    const home = standingsMap.get(match.homePlayerId)
    const away = standingsMap.get(match.awayPlayerId)
    if (!home || !away) return
    home.played++; away.played++
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore
    if (match.homeScore > match.awayScore) { home.won++; home.points += 3; away.lost++ }
    else if (match.homeScore < match.awayScore) { away.won++; away.points += 3; home.lost++ }
    else { home.drawn++; away.drawn++; home.points += 1; away.points += 1 }
  })

  const standings = Array.from(standingsMap.values()).map(s => {
    s.goalDiff = s.goalsFor - s.goalsAgainst
    return s
  }).filter(s => s.played > 0)

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.playerName.localeCompare(b.playerName)
  })

  return { standings, seasonName: targetSeason.name, seasons, activeSeasonId: targetSeason.id }
}

export default async function KlasemenPage({ searchParams }: { searchParams: { season?: string } }) {
  const { standings, seasonName, seasons, activeSeasonId } = await getStandings(searchParams.season)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Klasemen</h1>
            <p className="text-sm text-muted-foreground">
              {seasonName ? `Statistik Musim: ${seasonName}` : 'Pilih Musim'}
            </p>
          </div>
        </div>

        {/* Season Selector Dropdown */}
        <div className="mt-2 md:mt-0">
          <SeasonSelector seasons={seasons} currentSeasonId={activeSeasonId || undefined} />
        </div>
      </div>

      <div className="game-card overflow-hidden border border-border/50">
        <StandingsTable standings={standings} />
      </div>
    </div>
  )
}

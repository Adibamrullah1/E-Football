export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Trophy, Calendar, ArrowRight, Gamepad2, Zap, Target } from 'lucide-react'
import StandingsTable from '@/components/public/StandingsTable'
import MatchCard from '@/components/public/MatchCard'
import MonthlyChampions from '@/components/public/MonthlyChampions'

async function getHomeData() {
  const [recentMatches, upcomingMatches, players, season, pastSeasons] = await Promise.all([
    prisma.match.findMany({
      where: { status: 'FINISHED' },
      select: { id: true, homeScore: true, awayScore: true, status: true, scheduledAt: true, playedAt: true,
        homePlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
        awayPlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
      },
      orderBy: { playedAt: 'desc' },
      take: 4,
    }),
    prisma.match.findMany({
      where: { status: 'SCHEDULED' },
      select: { id: true, status: true, scheduledAt: true,
        homePlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
        awayPlayer: { select: { id: true, name: true, shortName: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 4,
    }),
    prisma.player.findMany({ select: { id: true, name: true, shortName: true, avatarUrl: true } }),
    prisma.season.findFirst({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.season.findMany({
      where: { isActive: false },
      select: { id: true, name: true, endDate: true,
        matches: { where: { status: 'FINISHED' }, select: { homePlayerId: true, awayPlayerId: true, homeScore: true, awayScore: true } }
      },
      orderBy: { endDate: 'desc' },
      take: 3,
    })
  ])

  // Compute standings for active season
  const finishedMatches = await prisma.match.findMany({
    where: { status: 'FINISHED', seasonId: season?.id },
    include: { homePlayer: true, awayPlayer: true },
  })

  const standingsMap = new Map<string, any>()
  players.forEach(player => {
    standingsMap.set(player.id, {
      playerId: player.id, playerName: player.name, shortName: player.shortName, avatarUrl: player.avatarUrl,
      played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    })
  })

  finishedMatches.forEach(match => {
    if (match.homeScore === null || match.awayScore === null) return
    const home = standingsMap.get(match.homePlayerId)
    const away = standingsMap.get(match.awayPlayerId)
    if (!home || !away) return
    home.played++; away.played++
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore
    if (match.homeScore > match.awayScore) { home.won++; home.points += 3; away.lost++ }
    else if (match.homeScore < match.awayScore) { away.won++; away.points += 3; home.lost++ }
    else { home.drawn++; home.points += 1; away.drawn++; away.points += 1 }
    home.goalDiff = home.goalsFor - home.goalsAgainst
    away.goalDiff = away.goalsFor - away.goalsAgainst
  })

  const standings = Array.from(standingsMap.values())
    .filter(s => s.played > 0)
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)

  // Calculate champions for past seasons
  const champions = pastSeasons.map(s => {
    const sMap = new Map<string, any>()
    players.forEach(p => sMap.set(p.id, { points: 0, playerName: p.name, shortName: p.shortName }))
    s.matches.forEach(m => {
      if (m.homeScore === null || m.awayScore === null) return
      const home = sMap.get(m.homePlayerId)
      const away = sMap.get(m.awayPlayerId)
      if (!home || !away) return
      if (m.homeScore > m.awayScore) home.points += 3
      else if (m.homeScore < m.awayScore) away.points += 3
      else { home.points += 1; away.points += 1 }
    })
    const sorted = Array.from(sMap.values()).sort((a, b) => b.points - a.points)
    const winner = sorted[0]
    return winner && winner.points > 0 ? { seasonName: s.name, ...winner } : null
  }).filter(Boolean) as { seasonName: string; playerName: string; shortName: string; points: number }[]

  return {
    recentMatches,
    upcomingMatches,
    standings,
    season,
    champions
  }
}

export default async function HomePage() {
  const data = await getHomeData()

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gaming-accent rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-neon" />
              <span className="text-sm text-primary font-medium">
                {data.season ? data.season.name : 'Liga eFootball Mobile'}
              </span>
            </div>
            <h1 className="font-gaming text-4xl md:text-6xl font-black tracking-wider mb-4">
              <span className="gradient-text">LIGA eFOOTBALL</span>
              <br />
              <span className="text-foreground">MOBILE</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Platform liga eFootball Mobile terlengkap. Ikuti klasemen, jadwal pertandingan, dan statistik player dari liga.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/klasemen"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-bold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Lihat Klasemen
              </Link>
              <Link
                href="/jadwal"
                className="px-6 py-3 rounded-xl bg-secondary border border-border/50 text-foreground font-semibold hover:border-primary/30 hover:bg-secondary/80 transition-all duration-300 flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Jadwal Tanding
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12 space-y-10 md:space-y-12">
        <section>
          <MonthlyChampions champions={data.champions} />
        </section>

        {/* Recent Results */}
        {data.recentMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-neon" />
                Hasil Terbaru
              </h2>
              <Link href="/jadwal" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentMatches.map((match: any) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standings Preview */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Klasemen
              </h2>
              <Link href="/klasemen" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Selengkapnya <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="game-card overflow-hidden">
              <StandingsTable standings={data.standings} />
            </div>
          </div>

          {/* Upcoming Matches */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-neon-blue" />
                Mendatang
              </h2>
            </div>
            <div className="space-y-3">
              {data.upcomingMatches.length > 0 ? data.upcomingMatches.map((match: any) => (
                <div key={match.id} className="game-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{match.homePlayer.shortName}</span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="text-xs font-bold text-gaming-accent bg-gaming-accent/10 px-2 py-0.5 rounded">{match.awayPlayer.shortName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(match.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {match.homePlayer.name} vs {match.awayPlayer.name}
                  </p>
                </div>
              )) : (
                <div className="game-card p-6 text-center">
                  <p className="text-muted-foreground text-sm">Belum ada jadwal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

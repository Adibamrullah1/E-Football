import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId')

    const matches = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        ...(seasonId ? { seasonId } : {}),
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    })

    const players = await prisma.player.findMany()

    const standingsMap = new Map<string, {
      playerId: string
      playerName: string
      shortName: string
      avatarUrl: string | null
      played: number
      won: number
      drawn: number
      lost: number
      goalsFor: number
      goalsAgainst: number
      goalDiff: number
      points: number
    }>()

    players.forEach(player => {
      standingsMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        shortName: player.shortName,
        avatarUrl: player.avatarUrl,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
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

      if (match.homeScore > match.awayScore) {
        home.won++; home.points += 3
        away.lost++
      } else if (match.homeScore < match.awayScore) {
        away.won++; away.points += 3
        home.lost++
      } else {
        home.drawn++; home.points += 1
        away.drawn++; away.points += 1
      }

      home.goalDiff = home.goalsFor - home.goalsAgainst
      away.goalDiff = away.goalsFor - away.goalsAgainst
    })

    const standings = Array.from(standingsMap.values())
      .filter(s => s.played > 0)
      .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor)

    return NextResponse.json(standings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute standings' }, { status: 500 })
  }
}

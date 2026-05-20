// ============================================================
// Matchmaking Service — Core Business Logic
// ============================================================
// Handles quota validation, eligibility checks, and match
// creation with clean architecture principles.
// GUARANTEE: FINISHED matches are NEVER modified or deleted.
// ============================================================

import { prisma } from '@/lib/prisma'
import {
  MATCHMAKING_LIMITS,
  type EligibilityResult,
  type QuotaInfo,
  type QuotaSummary,
  type PlayerQuota,
  type PairQuota,
} from './matchmaking.types'

// ------------------------------------------------------------
// Helper: Generate normalized pair key (A-B = B-A)
// ------------------------------------------------------------
export function generatePairKey(playerA: string, playerB: string): string {
  return playerA < playerB ? `${playerA}::${playerB}` : `${playerB}::${playerA}`
}

// ------------------------------------------------------------
// Helper: Get month boundaries for time-window queries
// This is how "reset otomatis" works — no cron needed.
// When the month changes, queries automatically only count
// matches in the new month.
// ------------------------------------------------------------
export function getMonthBoundaries(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

// ------------------------------------------------------------
// Helper: Format month label in Indonesian
// ------------------------------------------------------------
export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

// ------------------------------------------------------------
// Query: Count matches for a player in the current month
// Counts all statuses EXCEPT 'CANCELLED'
// ------------------------------------------------------------
export async function getPlayerMatchCount(
  playerId: string,
  date: Date = new Date()
): Promise<number> {
  const { start, end } = getMonthBoundaries(date)

  const count = await prisma.match.count({
    where: {
      AND: [
        {
          OR: [
            { homePlayerId: playerId },
            { awayPlayerId: playerId },
          ],
        },
        { scheduledAt: { gte: start, lte: end } },
        { status: { not: 'CANCELLED' } },
      ],
    },
  })

  return count
}

// ------------------------------------------------------------
// Query: Count matches for a specific pair in the current month
// Handles pair normalization (A-B = B-A)
// ------------------------------------------------------------
export async function getPairMatchCount(
  playerA: string,
  playerB: string,
  date: Date = new Date()
): Promise<number> {
  const { start, end } = getMonthBoundaries(date)

  const count = await prisma.match.count({
    where: {
      AND: [
        {
          OR: [
            { homePlayerId: playerA, awayPlayerId: playerB },
            { homePlayerId: playerB, awayPlayerId: playerA },
          ],
        },
        { scheduledAt: { gte: start, lte: end } },
        { status: { not: 'CANCELLED' } },
      ],
    },
  })

  return count
}

// ------------------------------------------------------------
// Core: Check if a match between two players is eligible
// Returns detailed quota information
// ------------------------------------------------------------
export async function checkEligibility(
  homePlayerId: string,
  awayPlayerId: string,
  date: Date = new Date()
): Promise<EligibilityResult> {
  const reasons: string[] = []
  const month = getMonthLabel(date)

  // Validation: same player check
  if (homePlayerId === awayPlayerId) {
    return {
      eligible: false,
      reasons: ['Player home dan away tidak boleh sama'],
      quotas: {
        homePlayer: { used: 0, max: MATCHMAKING_LIMITS.MAX_MATCHES_PER_PLAYER_PER_MONTH, remaining: 0 },
        awayPlayer: { used: 0, max: MATCHMAKING_LIMITS.MAX_MATCHES_PER_PLAYER_PER_MONTH, remaining: 0 },
        pair: { used: 0, max: MATCHMAKING_LIMITS.MAX_MATCHES_PER_PAIR_PER_MONTH, remaining: 0 },
      },
      month,
    }
  }

  // Run all quota queries in parallel for performance
  const [homeCount, awayCount, pairCount] = await Promise.all([
    getPlayerMatchCount(homePlayerId, date),
    getPlayerMatchCount(awayPlayerId, date),
    getPairMatchCount(homePlayerId, awayPlayerId, date),
  ])

  const maxPlayer = MATCHMAKING_LIMITS.MAX_MATCHES_PER_PLAYER_PER_MONTH
  const maxPair = MATCHMAKING_LIMITS.MAX_MATCHES_PER_PAIR_PER_MONTH

  // Build quota info
  const homeQuota: QuotaInfo = {
    used: homeCount,
    max: maxPlayer,
    remaining: Math.max(0, maxPlayer - homeCount),
  }

  const awayQuota: QuotaInfo = {
    used: awayCount,
    max: maxPlayer,
    remaining: Math.max(0, maxPlayer - awayCount),
  }

  const pairQuota: QuotaInfo = {
    used: pairCount,
    max: maxPair,
    remaining: Math.max(0, maxPair - pairCount),
  }

  // Check violations
  if (homeCount >= maxPlayer) {
    reasons.push(`Player home sudah mencapai batas ${maxPlayer} match di bulan ${month} (${homeCount}/${maxPlayer})`)
  }

  if (awayCount >= maxPlayer) {
    reasons.push(`Player away sudah mencapai batas ${maxPlayer} match di bulan ${month} (${awayCount}/${maxPlayer})`)
  }

  if (pairCount >= maxPair) {
    reasons.push(`Pasangan ini sudah mencapai batas ${maxPair} match di bulan ${month} (${pairCount}/${maxPair})`)
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    quotas: {
      homePlayer: homeQuota,
      awayPlayer: awayQuota,
      pair: pairQuota,
    },
    month,
  }
}

// ------------------------------------------------------------
// Core: Get quota summary for all players and pairs
// Optionally filter by a specific player
// ------------------------------------------------------------
export async function getQuotaSummary(
  playerId?: string,
  date: Date = new Date()
): Promise<QuotaSummary> {
  const { start, end } = getMonthBoundaries(date)
  const month = getMonthLabel(date)

  // Build where clause for matches in this month
  const whereClause: any = {
    scheduledAt: { gte: start, lte: end },
    status: { not: 'CANCELLED' },
  }

  // If filtering by player
  if (playerId) {
    whereClause.OR = [
      { homePlayerId: playerId },
      { awayPlayerId: playerId },
    ]
  }

  const matches = await prisma.match.findMany({
    where: whereClause,
    include: {
      homePlayer: { select: { id: true, name: true } },
      awayPlayer: { select: { id: true, name: true } },
    },
  })

  // Calculate player quotas
  const playerMap = new Map<string, { name: string; count: number }>()
  const pairMap = new Map<string, { p1Id: string; p1Name: string; p2Id: string; p2Name: string; count: number }>()

  for (const match of matches) {
    // Count per player
    const homeId = match.homePlayerId
    const awayId = match.awayPlayerId

    if (!playerMap.has(homeId)) {
      playerMap.set(homeId, { name: match.homePlayer.name, count: 0 })
    }
    playerMap.get(homeId)!.count++

    if (!playerMap.has(awayId)) {
      playerMap.set(awayId, { name: match.awayPlayer.name, count: 0 })
    }
    playerMap.get(awayId)!.count++

    // Count per pair (normalized)
    const pairKey = generatePairKey(homeId, awayId)
    if (!pairMap.has(pairKey)) {
      const [firstId, secondId] = homeId < awayId ? [homeId, awayId] : [awayId, homeId]
      const firstName = homeId < awayId ? match.homePlayer.name : match.awayPlayer.name
      const secondName = homeId < awayId ? match.awayPlayer.name : match.homePlayer.name
      pairMap.set(pairKey, {
        p1Id: firstId,
        p1Name: firstName,
        p2Id: secondId,
        p2Name: secondName,
        count: 0,
      })
    }
    pairMap.get(pairKey)!.count++
  }

  // Build response
  const maxPlayer = MATCHMAKING_LIMITS.MAX_MATCHES_PER_PLAYER_PER_MONTH
  const maxPair = MATCHMAKING_LIMITS.MAX_MATCHES_PER_PAIR_PER_MONTH

  const players: PlayerQuota[] = Array.from(playerMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      matchCount: data.count,
      max: maxPlayer,
      remaining: Math.max(0, maxPlayer - data.count),
    }))
    .sort((a, b) => b.matchCount - a.matchCount)

  const pairs: PairQuota[] = Array.from(pairMap.values())
    .map((data) => ({
      player1Id: data.p1Id,
      player1Name: data.p1Name,
      player2Id: data.p2Id,
      player2Name: data.p2Name,
      matchCount: data.count,
      max: maxPair,
      remaining: Math.max(0, maxPair - data.count),
    }))
    .sort((a, b) => b.matchCount - a.matchCount)

  return {
    month,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    players,
    pairs,
  }
}

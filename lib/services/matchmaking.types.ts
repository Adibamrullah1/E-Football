// ============================================================
// Matchmaking Types — Clean Architecture Type Definitions
// ============================================================

export const MATCHMAKING_LIMITS = {
  /** Maksimal match per user per bulan */
  MAX_MATCHES_PER_PLAYER_PER_MONTH: 60,
  /** Maksimal match antar pasangan user per bulan */
  MAX_MATCHES_PER_PAIR_PER_MONTH: 15,
} as const

export interface QuotaInfo {
  used: number
  max: number
  remaining: number
}

export interface EligibilityResult {
  eligible: boolean
  reasons: string[]
  quotas: {
    homePlayer: QuotaInfo
    awayPlayer: QuotaInfo
    pair: QuotaInfo
  }
  month: string // e.g. "April 2026"
}

export interface PlayerQuota {
  id: string
  name: string
  matchCount: number
  max: number
  remaining: number
}

export interface PairQuota {
  player1Id: string
  player1Name: string
  player2Id: string
  player2Name: string
  matchCount: number
  max: number
  remaining: number
}

export interface QuotaSummary {
  month: string
  periodStart: string
  periodEnd: string
  players: PlayerQuota[]
  pairs: PairQuota[]
}

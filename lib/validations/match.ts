import { z } from 'zod'

export const matchSchema = z.object({
  seasonId: z.string().min(1, 'Pilih musim'),
  homePlayerId: z.string().min(1, 'Pilih player tuan rumah'),
  awayPlayerId: z.string().min(1, 'Pilih player tamu'),
  scheduledAt: z.string().min(1, 'Tentukan jadwal pertandingan'),
}).refine(data => data.homePlayerId !== data.awayPlayerId, {
  message: 'Player home dan away tidak boleh sama',
  path: ['awayPlayerId'],
})

export const resultSchema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  playedAt: z.string().optional(),
})

export const matchUpdateSchema = z.object({
  scheduledAt: z.string().min(1).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED']).optional(),
  homePlayerId: z.string().min(1).optional(),
  awayPlayerId: z.string().min(1).optional(),
}).refine(data => {
  if (data.homePlayerId && data.awayPlayerId) {
    return data.homePlayerId !== data.awayPlayerId
  }
  return true
}, {
  message: 'Player home dan away tidak boleh sama',
  path: ['awayPlayerId'],
})

export type MatchInput = z.infer<typeof matchSchema>
export type MatchUpdateInput = z.infer<typeof matchUpdateSchema>
export type ResultInput = z.infer<typeof resultSchema>

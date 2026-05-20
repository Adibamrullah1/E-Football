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

export type MatchInput = z.infer<typeof matchSchema>
export type ResultInput = z.infer<typeof resultSchema>

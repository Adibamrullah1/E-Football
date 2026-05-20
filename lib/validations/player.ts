import { z } from 'zod'

export const playerSchema = z.object({
  name: z.string().min(2).max(100),
  shortName: z.string().min(1).max(10).optional().nullable(),
  username: z.string().min(2).max(50).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
})

export type PlayerInput = z.infer<typeof playerSchema>

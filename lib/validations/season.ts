import { z } from 'zod'

export const seasonSchema = z.object({
  name: z.string().min(2, 'Nama musim minimal 2 karakter').max(100, 'Nama musim maksimal 100 karakter'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  isActive: z.boolean().optional().default(false),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end > start
  },
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['endDate'],
  }
)

export type SeasonInput = z.infer<typeof seasonSchema>

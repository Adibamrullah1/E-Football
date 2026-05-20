import ChecklistClient from '@/components/admin/ChecklistClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checklist Verifikasi Data | Admin',
}

export default function AdminChecklistPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Checklist Verifikasi</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Cek otomatis dan verifikasi manual data pemain, pertandingan, dan musim
        </p>
      </div>
      <ChecklistClient />
    </div>
  )
}

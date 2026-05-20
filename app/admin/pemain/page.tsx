export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { getPositionLabel } from '@/lib/utils'
import DeleteButton from '@/components/admin/DeleteButton'

export default async function AdminPemainPage() {
    const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Kelola Player</h1>
          <p className="text-muted-foreground">{players.length} player terdaftar</p>
        </div>
        <Link href="/admin/pemain/tambah"
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Player
        </Link>
      </div>

      <div className="game-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Player</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Singkatan</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Username</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Kota</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-border/30 table-row-hover transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">{player.name}</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{player.shortName}</span>
                  </td>
                  <td className="text-center py-3 px-4 text-muted-foreground">@{player.username}</td>
                  <td className="text-center py-3 px-4 text-muted-foreground">{player.city || '-'}</td>
                  <td className="text-right py-3 px-4">
                    <Link href={`/admin/pemain/${player.id}/edit`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors inline-flex" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteButton apiUrl={`/api/players/${player.id}`} confirmMessage={`Hapus player ${player.name}?`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

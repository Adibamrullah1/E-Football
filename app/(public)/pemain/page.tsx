export const revalidate = 60

import { prisma } from '@/lib/prisma'
import PlayerCard from '@/components/public/PlayerCard'
import { UserCircle } from 'lucide-react'

export default async function PemainPage() {
  const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center">
          <UserCircle className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Daftar Player</h1>
          <p className="text-sm text-muted-foreground">{players.length} player terdaftar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player: any) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-20">
          <UserCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Belum ada player terdaftar</p>
        </div>
      )}
    </div>
  )
}

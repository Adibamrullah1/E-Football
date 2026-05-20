export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PlayerForm from '@/components/admin/PlayerForm'

export default async function EditPemainPage({ params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({ where: { id: params.id } })
  if (!player) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Edit Pemain</h1>
        <p className="text-muted-foreground">Edit data {player.name}</p>
      </div>
      <PlayerForm mode="edit" initialData={player} />
    </div>
  )
}

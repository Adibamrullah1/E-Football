export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ResultForm from '@/components/admin/ResultForm'

export default async function HasilPertandinganPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      homePlayer: true,
      awayPlayer: true,
      season: true,
    },
  })

  if (!match) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Input Hasil Pertandingan</h1>
        <p className="text-muted-foreground">
          {match.homePlayer.name} vs {match.awayPlayer.name} · {match.season.name}
        </p>
      </div>
      <ResultForm match={match} />
    </div>
  )
}

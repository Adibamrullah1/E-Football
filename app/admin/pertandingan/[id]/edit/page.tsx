import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MatchForm from '@/components/admin/MatchForm'

export default async function EditPertandinganPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
  })

  if (!match) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Edit Pertandingan</h1>
        <p className="text-muted-foreground">Ubah data kerangka pertandingan</p>
      </div>
      <MatchForm initialData={match} />
    </div>
  )
}

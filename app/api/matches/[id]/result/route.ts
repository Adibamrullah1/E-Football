import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { resultSchema } from '@/lib/validations/match'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = resultSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      // Update match score and status
      const match = await tx.match.update({
        where: { id: params.id },
        data: {
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: 'FINISHED',
          playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
        },
      })



      return match
    })

    // Bersihkan cache publik agar sinkron tanpa delay
    revalidateTag('matches')
    revalidateTag('players')
    revalidateTag('seasons')

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { playerSchema } from '@/lib/validations/player'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: {
        homeMatches: { include: { awayPlayer: true }, orderBy: { scheduledAt: 'desc' }, take: 5 },
        awayMatches: { include: { homePlayer: true }, orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json(player)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = playerSchema.parse(body)

    const player = await prisma.player.update({
      where: { id: params.id },
      data: {
        name: data.name,
        ...(data.shortName && { shortName: data.shortName }),
        ...(data.username && { username: data.username }),
        avatarUrl: data.avatarUrl ?? null,
        description: data.description ?? null,
        city: data.city ?? null,
      },
    })

    revalidateTag('players')
    revalidateTag('matches')
    revalidateTag('seasons')

    return NextResponse.json(player)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.$transaction([
      prisma.match.deleteMany({
        where: { OR: [{ homePlayerId: params.id }, { awayPlayerId: params.id }] },
      }),
      prisma.player.delete({ where: { id: params.id } }),
    ])

    revalidateTag('players')
    revalidateTag('matches')
    revalidateTag('seasons')

    return NextResponse.json({ message: 'Player deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}

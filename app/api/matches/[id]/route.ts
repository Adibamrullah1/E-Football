import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        homePlayer: true,
        awayPlayer: true,
        season: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const match = await prisma.match.update({
      where: { id: params.id },
      data: {
        ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
        ...(body.status && { status: body.status }),
        ...(body.homePlayerId && { homePlayerId: body.homePlayerId }),
        ...(body.awayPlayerId && { awayPlayerId: body.awayPlayerId }),
      },
      include: { homePlayer: true, awayPlayer: true },
    })

    revalidateTag('matches')
    revalidateTag('seasons')
    revalidateTag('players')

    return NextResponse.json(match)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.match.delete({ where: { id: params.id } })

    revalidateTag('matches')
    revalidateTag('seasons')
    revalidateTag('players')

    return NextResponse.json({ message: 'Match deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
  }
}

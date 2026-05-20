import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(seasons)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // If setting as active, deactivate all others
    if (body.isActive) {
      await prisma.season.updateMany({
        data: { isActive: false },
      })
    }

    const season = await prisma.season.create({
      data: {
        name: body.name,
        isActive: body.isActive || false,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    })
    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}

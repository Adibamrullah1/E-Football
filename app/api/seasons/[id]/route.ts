import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, startDate, endDate, isActive } = body

    if (isActive) {
      // Deactivate all other seasons if this one is set to active
      await prisma.season.updateMany({
        where: { id: { not: params.id } },
        data: { isActive: false },
      })
    }

    const season = await prisma.season.update({
      where: { id: params.id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    })
    
    return NextResponse.json(season)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.season.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Season deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isVerified } = await request.json()

    if (typeof isVerified !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const match = await prisma.match.update({
      where: { id: params.id },
      data: { isVerified },
    })
    
    // Invalidate public page caches so they might pick up any verified changes if needed
    revalidateTag('matches')
    revalidateTag('standings')

    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Failed to verify match:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah status verifikasi' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { playerSchema } from '@/lib/validations/player'
import { sanitizeObject } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

function generateShortName(name: string): string {
  // Ambil huruf pertama setiap kata, maks 5 huruf, uppercase
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5)
}

function generateUsername(name: string): string {
  // Hapus spasi & karakter khusus, lowercase
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
}

export async function GET(req: Request) {
  try {
    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(players)
  } catch (error) {
    logger.error('Failed to fetch players', error, { path: '/api/players' })
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const rateLimited = checkRateLimit(req, { maxRequests: 20, windowMs: 60_000 })
  if (rateLimited) return rateLimited

  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const data = playerSchema.parse(sanitized)

    // Auto-generate shortName & username jika tidak diisi
    const shortName = data.shortName || generateShortName(data.name)
    let username = data.username || generateUsername(data.name)

    // Pastikan username unik: tambahkan angka jika sudah ada
    const existing = await prisma.player.findUnique({ where: { username } })
    if (existing) {
      username = `${username}${Date.now().toString().slice(-4)}`
    }

    const player = await prisma.player.create({
      data: {
        ...data,
        shortName,
        username,
      },
    })

    logger.audit({
      action: 'CREATE',
      entity: 'Player',
      entityId: player.id,
      userId: (session.user as any)?.id,
      details: { name: player.name, username: player.username },
    })

    revalidateTag('players')
    
    return NextResponse.json(player, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    logger.error('Failed to create player', error, { path: '/api/players' })
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { seedBlobIfEmpty } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/init
 * Seeds Vercel Blob storage from committed data/ JSON files on first deploy.
 * Safe to call multiple times — it's a no-op if blobs already exist.
 * Vercel automatically calls this via the "First Deploy" hook, or you can
 * trigger it manually after connecting the Blob store.
 */
export async function GET() {
  try {
    await seedBlobIfEmpty()
    return NextResponse.json({ ok: true, message: 'Storage initialized' })
  } catch (error: any) {
    console.error('[/api/init] Seed error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

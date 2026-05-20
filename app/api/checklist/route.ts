import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface CheckIssue {
  id: string
  category: 'pemain' | 'pertandingan' | 'musim'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  link?: string
}

export async function GET() {
  try {
    const issues: CheckIssue[] = []

    // ─── PEMAIN CHECKS ───────────────────────────────────────────
    const players = await prisma.player.findMany({
      select: { id: true, name: true, shortName: true, username: true, city: true },
    })

    // Check: Pemain tanpa kota
    players.forEach((p) => {
      if (!p.city || p.city.trim() === '') {
        issues.push({
          id: `player-no-city-${p.id}`,
          category: 'pemain',
          severity: 'warning',
          title: `Pemain tanpa kota`,
          description: `${p.name} belum memiliki data kota.`,
          link: `/admin/pemain/${p.id}/edit`,
        })
      }
    })

    // Check: Nama duplikat
    const nameCount = new Map<string, typeof players>()
    players.forEach((p) => {
      const key = p.name.toLowerCase().trim()
      if (!nameCount.has(key)) nameCount.set(key, [])
      nameCount.get(key)!.push(p)
    })
    nameCount.forEach((group, name) => {
      if (group.length > 1) {
        issues.push({
          id: `player-duplicate-name-${name}`,
          category: 'pemain',
          severity: 'error',
          title: `Nama pemain duplikat`,
          description: `Ditemukan ${group.length} pemain dengan nama "${group[0].name}": ${group.map(p => p.shortName).join(', ')}.`,
          link: `/admin/pemain`,
        })
      }
    })

    // Check: ShortName duplikat
    const shortNameCount = new Map<string, typeof players>()
    players.forEach((p) => {
      const key = p.shortName.toLowerCase().trim()
      if (!shortNameCount.has(key)) shortNameCount.set(key, [])
      shortNameCount.get(key)!.push(p)
    })
    shortNameCount.forEach((group, sn) => {
      if (group.length > 1) {
        issues.push({
          id: `player-duplicate-short-${sn}`,
          category: 'pemain',
          severity: 'error',
          title: `Singkatan pemain duplikat`,
          description: `Singkatan "${group[0].shortName}" dipakai oleh: ${group.map(p => p.name).join(', ')}.`,
          link: `/admin/pemain`,
        })
      }
    })

    // ─── PERTANDINGAN CHECKS ────────────────────────────────────
    const matches = await prisma.match.findMany({
      select: {
        id: true,
        status: true,
        homeScore: true,
        awayScore: true,
        scheduledAt: true,
        homePlayerId: true,
        awayPlayerId: true,
        homePlayer: { select: { name: true, shortName: true } },
        awayPlayer: { select: { name: true, shortName: true } },
        season: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    // Check: FINISHED tanpa skor
    matches.forEach((m) => {
      if (m.status === 'FINISHED' && (m.homeScore === null || m.awayScore === null)) {
        issues.push({
          id: `match-no-score-${m.id}`,
          category: 'pertandingan',
          severity: 'error',
          title: `Pertandingan selesai tanpa skor`,
          description: `${m.homePlayer.name} vs ${m.awayPlayer.name} berstatus SELESAI tapi skor belum diisi.`,
          link: `/admin/pertandingan/${m.id}/hasil`,
        })
      }
    })

    // Check: Home = Away
    matches.forEach((m) => {
      if (m.homePlayerId === m.awayPlayerId) {
        issues.push({
          id: `match-same-player-${m.id}`,
          category: 'pertandingan',
          severity: 'error',
          title: `Pemain melawan diri sendiri`,
          description: `${m.homePlayer.name} bermain sebagai home dan away sekaligus.`,
          link: `/admin/pertandingan/${m.id}/edit`,
        })
      }
    })

    // Check: Jadwal bentrok (pemain bermain 2x di waktu yg sama ±30 menit)
    const scheduledMatches = matches.filter(
      (m) => m.status === 'SCHEDULED' || m.status === 'LIVE'
    )
    for (let i = 0; i < scheduledMatches.length; i++) {
      for (let j = i + 1; j < scheduledMatches.length; j++) {
        const a = scheduledMatches[i]
        const b = scheduledMatches[j]
        const timeA = new Date(a.scheduledAt).getTime()
        const timeB = new Date(b.scheduledAt).getTime()
        const diffMinutes = Math.abs(timeA - timeB) / (1000 * 60)

        if (diffMinutes < 30) {
          const playersA = [a.homePlayerId, a.awayPlayerId]
          const playersB = [b.homePlayerId, b.awayPlayerId]
          const overlap = playersA.filter((p) => playersB.includes(p))

          if (overlap.length > 0) {
            const overlapNames = overlap.map((pid) => {
              const p = players.find((pl) => pl.id === pid)
              return p?.name || pid
            })
            issues.push({
              id: `match-conflict-${a.id}-${b.id}`,
              category: 'pertandingan',
              severity: 'error',
              title: `Jadwal bentrok`,
              description: `${overlapNames.join(', ')} memiliki 2 pertandingan dalam jarak <30 menit: "${a.homePlayer.shortName} vs ${a.awayPlayer.shortName}" dan "${b.homePlayer.shortName} vs ${b.awayPlayer.shortName}".`,
              link: `/admin/pertandingan`,
            })
          }
        }
      }
    }

    // Check: SCHEDULED pertandingan yang sudah lewat jadwalnya
    const now = new Date()
    scheduledMatches.forEach((m) => {
      const scheduledTime = new Date(m.scheduledAt)
      const hoursOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60)
      if (hoursOverdue > 2) {
        issues.push({
          id: `match-overdue-${m.id}`,
          category: 'pertandingan',
          severity: 'warning',
          title: `Pertandingan belum diupdate`,
          description: `${m.homePlayer.name} vs ${m.awayPlayer.name} dijadwalkan ${Math.floor(hoursOverdue)} jam yang lalu tapi masih berstatus DIJADWALKAN.`,
          link: `/admin/pertandingan/${m.id}/hasil`,
        })
      }
    })

    // ─── MUSIM CHECKS ───────────────────────────────────────────
    const seasons = await prisma.season.findMany({
      include: { _count: { select: { matches: true } } },
    })

    // Check: >1 musim aktif
    const activeSeasons = seasons.filter((s) => s.isActive)
    if (activeSeasons.length > 1) {
      issues.push({
        id: 'season-multi-active',
        category: 'musim',
        severity: 'error',
        title: `Lebih dari 1 musim aktif`,
        description: `Ditemukan ${activeSeasons.length} musim aktif: ${activeSeasons.map(s => s.name).join(', ')}. Seharusnya hanya 1 musim yang aktif.`,
        link: `/admin/musim`,
      })
    }

    // Check: Tidak ada musim aktif
    if (activeSeasons.length === 0 && seasons.length > 0) {
      issues.push({
        id: 'season-no-active',
        category: 'musim',
        severity: 'warning',
        title: `Tidak ada musim aktif`,
        description: `Semua ${seasons.length} musim tidak ada yang aktif. Pilih 1 musim untuk diaktifkan.`,
        link: `/admin/musim`,
      })
    }

    // Check: Musim tanpa pertandingan
    seasons.forEach((s) => {
      if (s._count.matches === 0) {
        issues.push({
          id: `season-empty-${s.id}`,
          category: 'musim',
          severity: 'info',
          title: `Musim tanpa pertandingan`,
          description: `Musim "${s.name}" belum memiliki pertandingan.`,
          link: `/admin/pertandingan`,
        })
      }
    })

    // Sort: errors first, then warnings, then info
    const severityOrder = { error: 0, warning: 1, info: 2 }
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter((i) => i.severity === 'error').length,
        warnings: issues.filter((i) => i.severity === 'warning').length,
        info: issues.filter((i) => i.severity === 'info').length,
      },
    })
  } catch (error) {
    logger.error('Checklist API error', error, { path: '/api/checklist' })
    return NextResponse.json(
      { error: 'Gagal menjalankan pengecekan data' },
      { status: 500 }
    )
  }
}

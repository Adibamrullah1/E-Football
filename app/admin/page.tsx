export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import DashboardStats from '@/components/admin/DashboardStats'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import { formatDateTime, getStatusBadgeColor, getStatusLabel } from '@/lib/utils'

export default async function AdminDashboard() {
  const [totalPlayers, totalMatches, finishedMatches, recentMatches] = await Promise.all([
    prisma.player.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.match.findMany({
      include: { homePlayer: true, awayPlayer: true, season: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan liga eFootball Mobile</p>
      </div>

      <DashboardStats
        totalPlayers={totalPlayers}
        totalMatches={totalMatches}
        finishedMatches={finishedMatches}
      />

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-foreground">Pertandingan Terbaru</h2>
          <Link href="/admin/pertandingan" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Pertandingan</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Skor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Jadwal</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((match) => (
                  <tr key={match.id} className="border-b border-border/30 table-row-hover transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{match.homePlayer.shortName}</span>
                      <span className="text-muted-foreground mx-2">vs</span>
                      <span className="font-semibold text-foreground">{match.awayPlayer.shortName}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {match.status === 'FINISHED' ? (
                        <span className="font-gaming font-bold text-foreground">{match.homeScore} : {match.awayScore}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground text-xs">
                      {formatDateTime(match.scheduledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

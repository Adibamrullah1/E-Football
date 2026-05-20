'use client'

import { useState, useMemo } from 'react'
import { History, Search, Calendar } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import SeasonSelector from '@/components/public/SeasonSelector'

interface Player {
  id: string
  name: string
  shortName: string
}

interface Match {
  id: string
  status: string
  homeScore: number | null
  awayScore: number | null
  scheduledAt: string | Date
  homePlayer: Player
  awayPlayer: Player
  season: { name: string }
}

interface RiwayatClientProps {
  finished: Match[]
  seasons: {id: string, name: string, isActive: boolean}[]
  currentSeasonId: string | null
}

export default function RiwayatClient({ finished, seasons, currentSeasonId }: RiwayatClientProps) {
  const [search, setSearch] = useState('')

  // Filter function
  const matchSearch = (match: Match) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    
    const homeName = match.homePlayer.name?.toLowerCase() || ''
    const awayName = match.awayPlayer.name?.toLowerCase() || ''
    const homeShort = match.homePlayer.shortName?.toLowerCase() || ''
    const awayShort = match.awayPlayer.shortName?.toLowerCase() || ''
    
    return homeName.includes(q) || awayName.includes(q) || homeShort.includes(q) || awayShort.includes(q)
  }

  // Filtered list
  const filteredMatches = useMemo(() => finished.filter(matchSearch), [finished, search])

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Riwayat Pertandingan</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {finished.length} laga telah selesai
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 items-start sm:items-center">
          <SeasonSelector seasons={seasons} currentSeasonId={currentSeasonId || undefined} />
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* No Results Fallback */}
      {search && filteredMatches.length === 0 && (
        <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-border/50">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-foreground font-semibold">Tidak ada riwayat ditemukan</p>
        </div>
      )}

      {!search && finished.length === 0 && (
        <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-border/50">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Belum ada pertandingan yang selesai untuk musim ini.</p>
        </div>
      )}

      {/* Table Format */}
      {filteredMatches.length > 0 && (
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-center py-3 px-3 text-muted-foreground font-semibold text-xs uppercase w-12">No</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Pemain</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Skor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Tanggal</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase hidden sm:table-cell">Musim</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match, idx) => (
                  <tr key={match.id} className="border-b border-border/30 table-row-hover transition-colors">
                    <td className="text-center py-3 px-3 font-medium text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{match.homePlayer.name}</span>
                        <span className="text-muted-foreground text-xs">vs</span>
                        <span className="font-semibold text-foreground text-sm">{match.awayPlayer.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="inline-flex px-3 py-1 bg-secondary rounded-lg font-gaming font-bold tracking-wider text-sm shadow-inner">
                        <span className={match.homeScore! > match.awayScore! ? 'text-green-400' : match.homeScore! < match.awayScore! ? 'text-red-400' : 'text-yellow-400'}>
                          {match.homeScore}
                        </span>
                        <span className="mx-1 text-muted-foreground">-</span>
                        <span className={match.awayScore! > match.homeScore! ? 'text-green-400' : match.awayScore! < match.homeScore! ? 'text-red-400' : 'text-yellow-400'}>
                          {match.awayScore}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 font-medium">
                      {formatShortDate(match.scheduledAt)}
                    </td>
                    <td className="text-center py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                      {match.season.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { History, Search, Calendar, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDayDate } from '@/lib/utils'
import SeasonSelector from '@/components/public/SeasonSelector'
import MatchCard from '@/components/public/MatchCard'

const ITEMS_PER_PAGE = 24

interface Player {
  id: string
  name: string
  shortName: string
  avatarUrl?: string | null
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
  const [page, setPage] = useState(1)

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / ITEMS_PER_PAGE))
  const paginatedMatches = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredMatches.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMatches, page])

  // Group by date
  const groupMatches = (matches: Match[]) => {
    const grouped = new Map<string, Match[]>()
    matches.forEach(match => {
      const dateKey = formatDayDate(match.scheduledAt)
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(match)
    })
    return Array.from(grouped.entries())
  }

  const groupedFinished = useMemo(() => groupMatches(paginatedMatches), [paginatedMatches])

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

      {/* Finished Matches Cards */}
      {groupedFinished.length > 0 && (
        <section className="mb-12">
          <div className="space-y-8">
            {groupedFinished.map(([dateConfig, dayMatches]) => (
              <div key={dateConfig}>
                <div className="inline-block px-3 py-1 mb-4 rounded-lg bg-green-500/10 text-green-400 font-semibold text-sm border border-green-500/20">
                  {dateConfig}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {dayMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>
              <div className="text-sm text-muted-foreground font-medium px-2">
                Halaman {page} dari {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 transition-colors text-sm font-medium"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

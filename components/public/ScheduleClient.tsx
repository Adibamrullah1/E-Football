'use client'

import { useState, useMemo } from 'react'
import MatchCard from '@/components/public/MatchCard'
import { Calendar, CheckCircle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const ITEMS_PER_PAGE = 24
import { formatDayDate } from '@/lib/utils'
import SeasonSelector from '@/components/public/SeasonSelector'

interface Player {
  id: string
  name: string
  shortName: string
  avatarUrl: string | null
}

interface Match {
  id: string
  status: string
  homeScore: number | null
  awayScore: number | null
  scheduledAt: string | Date
  homePlayer: Player
  awayPlayer: Player
}

interface ScheduleClientProps {
  matches: Match[]
  seasons: {id: string, name: string, isActive: boolean}[]
  currentSeasonId: string | null
}

export default function ScheduleClient({ matches, seasons, currentSeasonId }: ScheduleClientProps) {
  const [search, setSearch] = useState('')
  const [dateSearch, setDateSearch] = useState('')
  const [page, setPage] = useState(1)

  // Filter function
  const matchFilter = (match: Match) => {
    let isValid = true

    if (search.trim()) {
      const q = search.toLowerCase()
      const homeName = match.homePlayer.name?.toLowerCase() || ''
      const awayName = match.awayPlayer.name?.toLowerCase() || ''
      const homeShort = match.homePlayer.shortName?.toLowerCase() || ''
      const awayShort = match.awayPlayer.shortName?.toLowerCase() || ''
      
      const matchStringHomeAway = `${homeName} vs ${awayName}`
      const matchStringAwayHome = `${awayName} vs ${homeName}`
      const matchStringHomeAwayV = `${homeName} v ${awayName}`
      const matchStringAwayHomeV = `${awayName} v ${homeName}`
      
      isValid = homeName.includes(q) || 
                awayName.includes(q) || 
                homeShort.includes(q) || 
                awayShort.includes(q) ||
                matchStringHomeAway.includes(q) ||
                matchStringAwayHome.includes(q) ||
                matchStringHomeAwayV.includes(q) ||
                matchStringAwayHomeV.includes(q)
    }

    if (isValid && dateSearch) {
      try {
        const matchDateObj = new Date(match.scheduledAt)
        const matchYear = matchDateObj.getFullYear()
        const matchMonth = String(matchDateObj.getMonth() + 1).padStart(2, '0')
        const matchDay = String(matchDateObj.getDate()).padStart(2, '0')
        const matchDateStr = `${matchYear}-${matchMonth}-${matchDay}`
        
        if (matchDateStr !== dateSearch) {
          isValid = false
        }
      } catch (e) {
        isValid = true
      }
    }

    return isValid
  }

  // Filtered list (All matches that match search criteria)
  const filteredMatches = useMemo(() => matches.filter(matchFilter), [matches, search, dateSearch])

  // Split into Scheduled and Finished
  const scheduledMatches = useMemo(() => filteredMatches.filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE'), [filteredMatches])
  const finishedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'FINISHED'), [filteredMatches])

  // Pagination for Scheduled Matches
  const totalPagesScheduled = Math.max(1, Math.ceil(scheduledMatches.length / ITEMS_PER_PAGE))
  const paginatedScheduled = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return scheduledMatches.slice(start, start + ITEMS_PER_PAGE)
  }, [scheduledMatches, page])

  // Pagination for Finished Matches
  const totalPagesFinished = Math.max(1, Math.ceil(finishedMatches.length / ITEMS_PER_PAGE))
  const paginatedFinished = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return finishedMatches.slice(start, start + ITEMS_PER_PAGE)
  }, [finishedMatches, page])

  // Group by date (formatDayDate returns standard string representing the day)
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

  const groupedScheduled = useMemo(() => groupMatches(paginatedScheduled), [paginatedScheduled])
  const groupedFinished = useMemo(() => groupMatches(paginatedFinished), [paginatedFinished])

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-blue-600/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-neon-blue" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Jadwal Pertandingan</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {matches.length} total pertandingan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-0 w-full md:w-auto items-center">
          <div className="col-span-2 sm:w-auto">
            <SeasonSelector seasons={seasons} currentSeasonId={currentSeasonId || undefined} />
          </div>
          
          <div className="relative col-span-1 w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari player..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 sm:py-2.5 rounded-xl bg-secondary border border-border/50 text-[13px] sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="relative col-span-1 w-full sm:w-40">
            <input
              type="date"
              value={dateSearch}
              onChange={(e) => { setDateSearch(e.target.value); setPage(1); }}
              className="w-full px-2 py-2 sm:py-2.5 rounded-xl bg-secondary border border-border/50 text-[13px] sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-muted-foreground [&::-webkit-calendar-picker-indicator]:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* No Results Fallback */}
      {(search || dateSearch) && filteredMatches.length === 0 && (
        <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-border/50">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-foreground font-semibold">Tidak ada hasil ditemukan</p>
          <p className="text-sm text-muted-foreground">Coba gunakan kata kunci yang lain atau ubah tanggal.</p>
        </div>
      )}

      {/* Upcoming Matches */}
      {groupedScheduled.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="font-heading text-xl font-bold text-foreground">Jadwal Mendatang</h2>
          </div>

          <div className="space-y-8">
            {groupedScheduled.map(([dateConfig, dayMatches]) => (
              <div key={dateConfig}>
                <div className="inline-block px-3 py-1 mb-4 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
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

          {totalPagesScheduled > 1 && (
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
                Halaman {page} dari {totalPagesScheduled}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPagesScheduled, p + 1))}
                disabled={page === totalPagesScheduled}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 transition-colors text-sm font-medium"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Finished Matches */}
      {groupedFinished.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="font-heading text-xl font-bold text-foreground">Riwayat & Hasil Selesai</h2>
          </div>

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

          {totalPagesFinished > 1 && (
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
                Halaman {page} dari {totalPagesFinished}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPagesFinished, p + 1))}
                disabled={page === totalPagesFinished}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 transition-colors text-sm font-medium"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {!(search || dateSearch) && matches.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Belum ada pertandingan dijadwalkan untuk musim ini.</p>
        </div>
      )}
    </div>
  )
}

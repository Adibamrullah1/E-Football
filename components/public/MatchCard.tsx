import Link from 'next/link'
import { Calendar, Clock } from 'lucide-react'
import { formatShortDate, formatTime, getStatusBadgeColor, getStatusLabel } from '@/lib/utils'

interface MatchCardProps {
  match: {
    id: string
    status: string
    homeScore: number | null
    awayScore: number | null
    scheduledAt: string | Date
    homePlayer: { id: string; name: string; shortName: string; avatarUrl?: string | null }
    awayPlayer: { id: string; name: string; shortName: string; avatarUrl?: string | null }
  }
}

export default function MatchCard({ match }: MatchCardProps) {
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'

  return (
    <div className="game-card p-3 md:p-4 group">
      {/* Status & Date */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(match.status)} ${isLive ? 'pulse-live' : ''}`}>
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />}
          {getStatusLabel(match.status)}
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatShortDate(match.scheduledAt)}
          </span>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(match.scheduledAt)} WIB
          </span>
        </div>
      </div>

      {/* Match */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <Link href={`/pemain/${match.homePlayer.id}`} className="flex-1 text-center min-w-0 group/p">
          <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-xs font-bold text-primary mb-1 sm:mb-1.5 group-hover/p:ring-1 group-hover/p:ring-primary/50 transition-all overflow-hidden shrink-0">
            {match.homePlayer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={match.homePlayer.avatarUrl} alt={match.homePlayer.name} className="w-full h-full object-cover" loading="lazy" />
            ) : match.homePlayer.shortName}
          </div>
          <p className="text-xs font-semibold text-foreground group-hover/p:text-primary transition-colors truncate">
            {match.homePlayer.name}
          </p>
          <p className="text-[10px] text-muted-foreground">Home</p>
        </Link>

        {/* Score */}
        <div className="text-center px-1 sm:px-2 shrink-0">
          {isFinished || isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-gaming font-bold text-foreground tabular-nums">{match.homeScore}</span>
              <span className="text-sm sm:text-base text-muted-foreground font-bold">:</span>
              <span className="text-xl sm:text-2xl md:text-3xl font-gaming font-bold text-foreground tabular-nums">{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-base font-heading font-bold text-muted-foreground px-1">VS</div>
          )}
        </div>

        {/* Away */}
        <Link href={`/pemain/${match.awayPlayer.id}`} className="flex-1 text-center min-w-0 group/p">
          <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-gradient-to-br from-gaming-accent/20 to-secondary flex items-center justify-center text-xs font-bold text-gaming-accent mb-1 sm:mb-1.5 group-hover/p:ring-1 group-hover/p:ring-gaming-accent/50 transition-all overflow-hidden shrink-0">
            {match.awayPlayer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={match.awayPlayer.avatarUrl} alt={match.awayPlayer.name} className="w-full h-full object-cover" loading="lazy" />
            ) : match.awayPlayer.shortName}
          </div>
          <p className="text-xs font-semibold text-foreground group-hover/p:text-gaming-accent transition-colors truncate">
            {match.awayPlayer.name}
          </p>
          <p className="text-[10px] text-muted-foreground">Away</p>
        </Link>
      </div>
    </div>
  )
}

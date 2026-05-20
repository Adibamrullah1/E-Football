'use client'

import Link from 'next/link'
import { getPositionLabel } from '@/lib/utils'

interface PlayerCardProps {
  player: {
    id: string
    name: string
    username: string
    position: string
    nationality: string | null
    team?: { name: string; shortName: string } | null
  }
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const positionColors: Record<string, string> = {
    GK: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
    CB: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    LB: 'from-blue-400/20 to-blue-500/10 text-blue-300',
    RB: 'from-blue-400/20 to-blue-500/10 text-blue-300',
    CDM: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    CM: 'from-green-500/20 to-green-600/10 text-green-400',
    CAM: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    LW: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    RW: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    ST: 'from-red-500/20 to-red-600/10 text-red-400',
    CF: 'from-red-400/20 to-red-500/10 text-red-300',
  }

  return (
    <Link href={`/pemain/${player.id}`} className="game-card p-4 sm:p-5 block group">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold text-primary/60 group-hover:text-primary transition-colors shrink-0">
          {player.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {player.name}
          </h3>
          <p className="text-sm text-muted-foreground">@{player.username}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${positionColors[player.position] || 'from-gray-500/20 to-gray-600/10 text-gray-400'} text-xs font-bold`}>
          {player.position}
        </div>
      </div>
      {player.team && (
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
            {player.team.shortName}
          </div>
          <span className="text-sm text-muted-foreground">{player.team.name}</span>
        </div>
      )}
    </Link>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, Target, Trophy, Clock, Swords, CheckCircle2, XCircle, MinusCircle, Calendar, Gamepad2, History } from 'lucide-react'
import Link from 'next/link'
import MatchCard from '@/components/public/MatchCard'
import { formatTime, formatShortDate } from '@/lib/utils'

interface Match {
  id: string
  status: string
  homeScore: number | null
  awayScore: number | null
  scheduledAt: string | Date
  homePlayer: { id: string; name: string; shortName: string; avatarUrl: string | null }
  awayPlayer: { id: string; name: string; shortName: string; avatarUrl: string | null }
  season: { name: string }
}

interface PlayerStats {
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  remainingMatches: number
  winRate: number
  form: string[] // e.g. ['W', 'W', 'D', 'L', 'W']
}

interface PlayerProfileClientProps {
  player: {
    id: string
    name: string
    shortName: string
    username: string
    avatarUrl: string | null
    city: string | null
    description: string | null
  }
  stats: PlayerStats
  scheduledMatches: Match[]
  finishedMatches: Match[]
}

export default function PlayerProfileClient({ player, stats, scheduledMatches, finishedMatches }: PlayerProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'STATISTIK' | 'JADWAL' | 'RIWAYAT'>('STATISTIK')

  const renderFormBadge = (result: string, idx: number) => {
    let bgColor = 'bg-secondary text-muted-foreground border-border'
    if (result === 'W') bgColor = 'bg-green-500/10 text-green-500 border-green-500/20'
    else if (result === 'D') bgColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    else if (result === 'L') bgColor = 'bg-red-500/10 text-red-500 border-red-500/20'

    return (
      <div key={idx} className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${bgColor}`}>
        {result}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/pemain" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Player
      </Link>

      {/* Hero Section / Profile Header */}
      <div className="relative game-card p-6 md:p-8 mb-8 overflow-hidden rounded-3xl border border-border/50 bg-secondary/20 shadow-2xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-blue/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-90 group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-500"></div>
            <div className="w-28 h-28 md:w-36 md:h-36 relative rounded-2xl md:rounded-3xl bg-secondary border border-border shadow-inner overflow-hidden flex items-center justify-center text-5xl font-heading font-bold text-primary/30 shrink-0">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : player.shortName}
            </div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-secondary rounded-lg border border-border shadow-lg flex items-center justify-center -rotate-6">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border mb-3 text-xs md:text-sm">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground font-medium">Player Profile</span>
            </div>
            
            <h1 className="font-heading text-3xl md:text-5xl font-black text-foreground uppercase tracking-tight mb-2">
              {player.name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className="font-gaming text-sm md:text-base font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-lg">
                {player.shortName}
              </span>
              <span className="text-muted-foreground font-medium text-sm md:text-base">
                @{player.username}
              </span>
            </div>

            {player.description && (
              <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl balance-text leading-relaxed">
                {player.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => setActiveTab('STATISTIK')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'STATISTIK' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}>
          <Target className="w-4 h-4" /> Statistik
        </button>
        <button 
          onClick={() => setActiveTab('JADWAL')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'JADWAL' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}>
          <Clock className="w-4 h-4" /> Jadwal Tanding
          {stats.remainingMatches > 0 && (
            <span className="ml-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-[10px] text-white">
              {stats.remainingMatches}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('RIWAYAT')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'RIWAYAT' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}>
          <History className="w-4 h-4" /> Riwayat
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'STATISTIK' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Points */}
          <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl border border-primary/20 p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-semibold text-primary">Total Poin</span>
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-6xl font-heading font-black text-foreground drop-shadow-sm">{stats.points}</span>
              <span className="text-muted-foreground ml-2 font-medium">Pts</span>
            </div>
          </div>

          <div className="game-card p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Win Rate</span>
              <Target className="w-4 h-4 text-neon-blue" />
            </div>
            <div>
              <span className="text-3xl font-heading font-bold text-foreground">{stats.winRate}%</span>
            </div>
          </div>

          <div className="game-card p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Main</span>
              <Swords className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="text-3xl font-heading font-bold text-foreground">{stats.played}</span>
              <span className="text-xs text-muted-foreground block mt-1">Sisa {stats.remainingMatches} laga</span>
            </div>
          </div>

          <div className="game-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase">Menang</span>
            </div>
            <span className="text-xl font-bold">{stats.won}</span>
          </div>
          <div className="game-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase">Seri</span>
            </div>
            <span className="text-xl font-bold">{stats.drawn}</span>
          </div>
          <div className="game-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase">Kalah</span>
            </div>
            <span className="text-xl font-bold">{stats.lost}</span>
          </div>
          <div className="game-card p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase">Selisih Gol</span>
              <Target className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold tabular-nums ${stats.goalDiff > 0 ? 'text-green-400' : stats.goalDiff < 0 ? 'text-red-400' : 'text-foreground'}`}>
                {stats.goalDiff > 0 ? '+' : ''}{stats.goalDiff}
              </span>
              <span className="text-[10px] text-muted-foreground">({stats.goalsFor}:{stats.goalsAgainst})</span>
            </div>
          </div>

          {/* Formasi 5 Laga Terakhir */}
          {stats.form.length > 0 && (
            <div className="col-span-2 md:col-span-4 game-card p-6 mt-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Performa Terakhir (Form)</h3>
              <div className="flex items-center gap-2">
                {stats.form.map((res, i) => renderFormBadge(res, i))}
                {stats.form.length === 0 && <span className="text-sm text-muted-foreground">Belum ada pertandingan tercatat</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'JADWAL' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
            <Calendar className="w-5 h-5 text-neon" />
            <h2 className="font-heading text-lg font-bold text-foreground">Jadwal Sisa ({scheduledMatches.length})</h2>
          </div>
          
          {scheduledMatches.length === 0 ? (
            <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/50">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground font-medium">Bagus! Semua jatah bermain telah selesai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'RIWAYAT' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
            <History className="w-5 h-5 text-green-400" />
            <h2 className="font-heading text-lg font-bold text-foreground">Riwayat Permainan ({finishedMatches.length})</h2>
          </div>
          
          {finishedMatches.length === 0 ? (
            <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-border/50">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground font-medium">Pemain ini belum menyelesaikan satu pun pertandingan musim ini.</p>
            </div>
          ) : (
            <div className="game-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <th className="text-center py-3 px-3 text-muted-foreground font-semibold text-xs uppercase w-12">No</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Pertandingan</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Skor</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-xs uppercase">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedMatches.map((match, idx) => {
                      // Tentukan skor ini seri, menang atau kalah bagi pemain ini
                      const isHome = match.homePlayer.id === player.id
                      const playerScore = isHome ? match.homeScore! : match.awayScore!
                      const opponentScore = isHome ? match.awayScore! : match.homeScore!
                      
                      let resultColor = 'text-yellow-400'
                      if (playerScore > opponentScore) resultColor = 'text-green-400'
                      else if (playerScore < opponentScore) resultColor = 'text-red-400'

                      return (
                        <tr key={match.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                          <td className="text-center py-3 px-3 font-medium text-muted-foreground">
                            {finishedMatches.length - idx} {/* Nomor mundur */}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${isHome ? 'text-primary' : 'text-foreground'}`}>{match.homePlayer.name}</span>
                              <span className="text-muted-foreground text-xs">vs</span>
                              <span className={`font-semibold text-sm ${!isHome ? 'text-primary' : 'text-foreground'}`}>{match.awayPlayer.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="inline-flex px-3 py-1 bg-secondary rounded-lg font-gaming font-bold tracking-wider text-sm shadow-inner shadow-black">
                              <span className={resultColor}>
                                {match.homeScore} - {match.awayScore}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-muted-foreground text-xs font-medium">
                            {formatShortDate(match.scheduledAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

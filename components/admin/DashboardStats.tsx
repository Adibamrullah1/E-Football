'use client'

import { Users, UserCircle, Swords, Trophy } from 'lucide-react'

interface DashboardStatsProps {
  totalPlayers: number
  totalMatches: number
  finishedMatches: number
}

export default function DashboardStats({ totalPlayers, totalMatches, finishedMatches }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Sistem 1v1',
      value: 'Aktif',
      icon: Users,
      color: 'from-neon/20 to-neon-blue/20 border-neon/30',
      iconColor: 'text-neon',
    },
    {
      label: 'Total Player',
      value: totalPlayers,
      icon: UserCircle,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Total Pertandingan',
      value: totalMatches,
      icon: Swords,
      color: 'from-gaming-accent/20 to-orange-600/20 border-gaming-accent/30',
      iconColor: 'text-gaming-accent',
    },
    {
      label: 'Selesai Dimainkan',
      value: finishedMatches,
      icon: Trophy,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      iconColor: 'text-green-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-r ${stat.color} border p-5 transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="font-gaming text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center ${stat.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

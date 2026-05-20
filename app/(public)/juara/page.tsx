export const revalidate = 60

import { prisma } from '@/lib/prisma'
import { Trophy, Medal, Calendar } from 'lucide-react'

async function getChampions() {
  const players = await prisma.player.findMany()
  const pastSeasons = await prisma.season.findMany({
    where: { isActive: false },
    include: { matches: { where: { status: 'FINISHED' } } },
    orderBy: { endDate: 'desc' },
  })

  const champions = pastSeasons.map(s => {
    const sMap = new Map<string, any>()
    players.forEach(p => sMap.set(p.id, { points: 0, playerName: p.name, shortName: p.shortName, avatarUrl: p.avatarUrl }))
    s.matches.forEach(m => {
      if (m.homeScore === null || m.awayScore === null) return
      const home = sMap.get(m.homePlayerId)
      const away = sMap.get(m.awayPlayerId)
      if (!home || !away) return
      if (m.homeScore > m.awayScore) home.points += 3
      else if (m.homeScore < m.awayScore) away.points += 3
      else { home.points += 1; away.points += 1 }
    })
    const sorted = Array.from(sMap.values()).sort((a, b) => b.points - a.points)
    const winner = sorted[0]
    return winner && winner.points > 0 ? { seasonName: s.name, endDate: s.endDate, ...winner } : null
  }).filter(Boolean) as { seasonName: string; playerName: string; shortName: string; avatarUrl: string | null; points: number; endDate: Date }[]

  return champions
}

export default async function JuaraPage() {
  const champions = await getChampions()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Daftar Juara Bulanan</h1>
          <p className="text-sm text-muted-foreground">Prestasi tim terbaik di musim-musim yang telah berakhir</p>
        </div>
      </div>

      <div className="game-card p-6 border-yellow-500/10">
        <div className="space-y-4">
          {champions.length > 0 ? champions.map((champ, index) => (
            <div key={index} className="p-5 rounded-xl bg-secondary/30 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-yellow-500/40 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' : 'bg-secondary text-muted-foreground'}`}>
                  {index === 0 ? <Trophy className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-yellow-400 transition-colors">
                    {champ.playerName} <span className="text-sm text-muted-foreground font-normal ml-2">({champ.shortName})</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded font-semibold">
                      {champ.seasonName}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(champ.endDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center md:block">
                <span className="font-gaming text-3xl font-bold text-foreground inline-block px-4">{champ.points}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block">Total Poin</span>
              </div>
            </div>
          )) : (
             <div className="p-8 text-center text-muted-foreground">Belum ada riwayat juara dari musim sebelumnya.</div>
          )}
        </div>
      </div>
    </div>
  )
}

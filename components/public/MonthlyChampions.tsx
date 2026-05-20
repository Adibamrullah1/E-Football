import { Trophy, Medal } from 'lucide-react'

interface MonthlyChampionsProps {
  champions: {
    seasonName: string;
    playerName: string;
    shortName: string;
    points: number;
  }[]
}

export default function MonthlyChampions({ champions }: MonthlyChampionsProps) {
  if (champions.length === 0) return null

  return (
    <div className="game-card p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Juara Bulanan</h2>
          <p className="text-sm text-muted-foreground">Prestasi player terbaik di bulan-bulan sebelumnya</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        {champions.map((champ, i) => (
          <div key={i} className="p-4 rounded-xl bg-background border border-border/50 hover:border-yellow-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                {champ.seasonName}
              </span>
              <Medal className="w-5 h-5 text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center text-sm font-bold text-foreground">
                {champ.shortName}
              </div>
              <div>
                <p className="font-bold text-foreground">{champ.playerName}</p>
                <p className="text-xs text-muted-foreground">{champ.points} Poin</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

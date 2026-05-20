'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResultFormProps {
  match: {
    id: string
    homePlayer: { id: string; name: string; shortName: string }
    awayPlayer: { id: string; name: string; shortName: string }
    homeScore: number | null
    awayScore: number | null
  }
}

export default function ResultForm({ match }: ResultFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0)
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/matches/${match.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore,
          awayScore,
          playedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error('Gagal menyimpan hasil')

      router.push('/admin/pertandingan')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Score Input */}
      <div className="game-card p-6">
        <h3 className="font-heading text-xl font-bold text-foreground mb-6 text-center">Skor Pertandingan</h3>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-lg font-bold text-primary mb-2">
              {match.homePlayer.shortName}
            </div>
            <p className="text-sm font-semibold mb-3">{match.homePlayer.name}</p>
            <input type="number" min={0} max={99} value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
              className="w-20 h-16 rounded-xl bg-background border-2 border-primary/30 text-foreground text-3xl font-gaming font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <span className="text-3xl font-bold text-muted-foreground mt-8">:</span>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-gaming-accent/20 to-secondary flex items-center justify-center text-lg font-bold text-gaming-accent mb-2">
              {match.awayPlayer.shortName}
            </div>
            <p className="text-sm font-semibold mb-3">{match.awayPlayer.name}</p>
            <input type="number" min={0} max={99} value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
              className="w-20 h-16 rounded-xl bg-background border-2 border-gaming-accent/30 text-foreground text-3xl font-gaming font-bold text-center focus:outline-none focus:ring-2 focus:ring-gaming-accent/50" />
          </div>
        </div>
      </div>



      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold text-lg hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Hasil'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-lg bg-secondary text-muted-foreground border border-border/50 transition-all">
          Batal
        </button>
      </div>
    </form>
  )
}

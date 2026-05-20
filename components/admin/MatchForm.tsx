'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react'

interface MatchFormProps {
  initialData?: any
}

interface QuotaInfo {
  used: number
  max: number
  remaining: number
}

interface EligibilityData {
  eligible: boolean
  reasons: string[]
  quotas: {
    homePlayer: QuotaInfo
    awayPlayer: QuotaInfo
    pair: QuotaInfo
  }
  month: string
}

export default function MatchForm({ initialData }: MatchFormProps = {}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [players, setPlayers] = useState<any[]>([])
  const [seasons, setSeasons] = useState<any[]>([])
  const [form, setForm] = useState({
    seasonId: initialData?.seasonId || '',
    homePlayerId: initialData?.homePlayerId || '',
    awayPlayerId: initialData?.awayPlayerId || '',
    scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : '',
  })

  // Eligibility state
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers).catch(() => {})
    fetch('/api/seasons').then(r => r.json()).then((data) => {
      setSeasons(data)
      if (!initialData?.seasonId) {
        const active = data.find((s: any) => s.isActive)
        if (active) setForm(f => ({ ...f, seasonId: active.id }))
      }
    }).catch(() => {})
  }, [initialData])

  // Check eligibility when both players are selected (only for new matches)
  const checkEligibility = useCallback(async (homeId: string, awayId: string) => {
    if (!homeId || !awayId || homeId === awayId) {
      setEligibility(null)
      return
    }

    // Skip eligibility check for editing existing matches
    if (initialData) return

    setCheckingEligibility(true)
    try {
      const res = await fetch(`/api/matchmaking/eligibility?homePlayerId=${homeId}&awayPlayerId=${awayId}`)
      if (res.ok) {
        const data = await res.json()
        setEligibility(data)
      }
    } catch {
      // Silently fail — eligibility is informational
    } finally {
      setCheckingEligibility(false)
    }
  }, [initialData])

  useEffect(() => {
    checkEligibility(form.homePlayerId, form.awayPlayerId)
  }, [form.homePlayerId, form.awayPlayerId, checkEligibility])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.homePlayerId === form.awayPlayerId) {
      setError('Player home dan away tidak boleh sama')
      setLoading(false)
      return
    }

    try {
      const url = initialData ? `/api/matches/${initialData.id}` : '/api/matches'
      const method = initialData ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat pertandingan')
      }

      router.push('/admin/pertandingan')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper to render quota bar
  const renderQuotaBar = (label: string, quota: QuotaInfo) => {
    const percentage = Math.min(100, (quota.used / quota.max) * 100)
    const isNearLimit = quota.remaining <= 3
    const isAtLimit = quota.remaining === 0
    
    let barColor = 'bg-emerald-500'
    if (isAtLimit) barColor = 'bg-red-500'
    else if (isNearLimit) barColor = 'bg-amber-500'

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-semibold tabular-nums ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'}`}>
            {quota.used}/{quota.max}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-[10px] text-muted-foreground/70">
          Sisa {quota.remaining} match
        </div>
      </div>
    )
  }

  const isNewMatch = !initialData
  const isNotEligible = isNewMatch && eligibility && !eligibility.eligible

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Musim *</label>
        <select value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required>
          <option value="">Pilih Musim</option>
          {seasons.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Aktif)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Player 1 (Home) *</label>
          <select value={form.homePlayerId} onChange={(e) => setForm({ ...form, homePlayerId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required>
            <option value="">Pilih Player Home</option>
            {players.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Player 2 (Away) *</label>
          <select value={form.awayPlayerId} onChange={(e) => setForm({ ...form, awayPlayerId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required>
            <option value="">Pilih Player Away</option>
            {players.filter((p: any) => p.id !== form.homePlayerId).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Eligibility Info Panel ────────────────────────── */}
      {isNewMatch && form.homePlayerId && form.awayPlayerId && form.homePlayerId !== form.awayPlayerId && (
        <div className={`rounded-xl border p-4 transition-all duration-300 ${
          checkingEligibility
            ? 'bg-secondary/30 border-border/50'
            : eligibility?.eligible
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-red-500/5 border-red-500/20'
        }`}>
          {checkingEligibility ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memeriksa kuota...
            </div>
          ) : eligibility ? (
            <div className="space-y-3">
              {/* Status Header */}
              <div className="flex items-center gap-2">
                {eligibility.eligible ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Match diizinkan</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Kuota terlampaui</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  <Info className="w-3 h-3 inline mr-1" />
                  Periode: {eligibility.month}
                </span>
              </div>

              {/* Quota Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderQuotaBar(
                  `${players.find(p => p.id === form.homePlayerId)?.name || 'Home'}`,
                  eligibility.quotas.homePlayer
                )}
                {renderQuotaBar(
                  `${players.find(p => p.id === form.awayPlayerId)?.name || 'Away'}`,
                  eligibility.quotas.awayPlayer
                )}
                {renderQuotaBar('Head-to-Head', eligibility.quotas.pair)}
              </div>

              {/* Rejection Reasons */}
              {!eligibility.eligible && eligibility.reasons.length > 0 && (
                <div className="bg-red-500/10 rounded-lg px-3 py-2 space-y-1">
                  {eligibility.reasons.map((reason, i) => (
                    <p key={i} className="text-xs text-red-400">• {reason}</p>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
      {/* ────────────────────────────────────────────────── */}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Jadwal *</label>
        <input type="datetime-local" value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={loading || !!isNotEligible}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isNotEligible ? 'Kuota tidak mencukupi' : undefined}>
          {loading ? 'Menyimpan...' : (initialData ? 'Update Pertandingan' : 'Buat Pertandingan')}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-all">
          Batal
        </button>
      </div>
    </form>
  )
}

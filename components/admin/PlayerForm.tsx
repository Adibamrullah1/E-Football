'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PlayerFormProps {
  initialData?: {
    id?: string
    name: string
    shortName: string
    username: string
    avatarUrl: string | null
    description: string | null
    city: string | null
  }
  mode: 'create' | 'edit'
}

export default function PlayerForm({ initialData, mode }: PlayerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(mode === 'edit')
  const [form, setForm] = useState({
    name: initialData?.name || '',
    shortName: initialData?.shortName || '',
    username: initialData?.username || '',
    avatarUrl: initialData?.avatarUrl || '',
    description: initialData?.description || '',
    city: initialData?.city || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = mode === 'edit' ? `/api/players/${initialData?.id}` : '/api/players'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          shortName: form.shortName || undefined,
          username: form.username || undefined,
          avatarUrl: form.avatarUrl || null,
          description: form.description || null,
          city: form.city || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan pemain')
      }

      router.push('/admin/pemain')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Field utama: hanya Nama */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nama Player <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
          placeholder="Nama panggilan atau username eFootball"
          required
          autoFocus
        />
        {mode === 'create' && (
          <p className="text-xs text-muted-foreground mt-1">
            Singkatan dan username game akan dibuat otomatis dari nama.
          </p>
        )}
      </div>

      {/* Tombol show/hide advanced */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAdvanced ? 'Sembunyikan' : 'Tampilkan'} data tambahan (opsional)
      </button>

      {/* Data tambahan (opsional) */}
      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Singkatan <span className="text-muted-foreground font-normal">(maks. 5 huruf)</span>
              </label>
              <input
                type="text"
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono uppercase"
                placeholder="Misal: DIB"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Username Game</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="PSN ID / username eFootball"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Asal Kota</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Contoh: Jakarta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">URL Avatar / Foto</label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Bio / Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Gaya bermain, posisi favorit, dll..."
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : mode === 'edit' ? 'Update Pemain' : 'Tambah Pemain'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-all"
        >
          Batal
        </button>
      </div>
    </form>
  )
}

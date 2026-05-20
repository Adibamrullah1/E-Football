'use client'

import { useState, useEffect } from 'react'
import { CalendarClock, Plus, CheckCircle } from 'lucide-react'
import DeleteButton from '@/components/admin/DeleteButton'

export default function AdminMusimPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
  })

  const fetchSeasons = async () => {
    const res = await fetch('/api/seasons')
    const data = await res.json()
    setSeasons(data)
    setLoading(false)
  }

  useEffect(() => { fetchSeasons() }, [])

  const handleEdit = (season: any) => {
    setForm({
      id: season.id,
      name: season.name,
      startDate: new Date(season.startDate).toISOString().split('T')[0],
      endDate: new Date(season.endDate).toISOString().split('T')[0],
      isActive: season.isActive,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (form.id) {
        // Edit Mode
        await fetch(`/api/seasons/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        // Create Mode
        await fetch('/api/seasons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowForm(false)
      setForm({ id: '', name: '', startDate: '', endDate: '', isActive: false })
      fetchSeasons()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Kelola Musim</h1>
          <p className="text-muted-foreground">{seasons.length} musim terdaftar</p>
        </div>
        <button onClick={() => {
            setForm({ id: '', name: '', startDate: '', endDate: '', isActive: false })
            setShowForm(!showForm)
          }}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold hover:shadow-lg hover:shadow-neon/30 transition-all duration-300 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Musim
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="game-card p-6 space-y-4">
          <h3 className="font-heading text-lg font-bold text-foreground">{form.id ? 'Edit Musim' : 'Musim Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nama Musim *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: Season 2 - 2025" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tanggal Mulai *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tanggal Selesai *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-primary text-primary" />
            <span className="text-sm text-foreground">Jadikan musim aktif</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-neon to-neon-blue text-gaming-dark font-semibold disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-lg bg-secondary text-muted-foreground border border-border/50">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {seasons.map((season: any) => (
          <div key={season.id} className="game-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{season.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {new Date(season.startDate).toLocaleDateString('id-ID')} — {new Date(season.endDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">{season._count?.matches || 0} laga</span>
              {season.isActive && (
                <span className="px-2 md:px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] md:text-xs font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 md:w-3.5 h-3 md:h-3.5" /> Aktif
                </span>
              )}
              <button onClick={() => handleEdit(season)}
                className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors flex items-center justify-center">
                ✎
              </button>
              <DeleteButton apiUrl={`/api/seasons/${season.id}`} confirmMessage={`Hapus musim ${season.name}? Seluruh pertandingan dalam musim ini akan ikut terhapus.`} />
            </div>
          </div>
        ))}
        {!loading && seasons.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Belum ada musim. Buat musim pertama!</p>
        )}
      </div>
    </div>
  )
}

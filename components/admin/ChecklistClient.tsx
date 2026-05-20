'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, AlertCircle, Info, ExternalLink, RefreshCw,
  Plus, Trash2, CheckCircle2, Circle, X, RotateCcw,
  ShieldCheck, ClipboardList, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────
interface CheckIssue {
  id: string
  category: 'pemain' | 'pertandingan' | 'musim'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  link?: string
}

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  createdAt: string
}

interface ApiResponse {
  issues: CheckIssue[]
  summary: { total: number; errors: number; warnings: number; info: number }
}

// ─── LocalStorage helpers ───────────────────────────────────
const STORAGE_KEY = 'efootball-admin-checklist'
const DISMISSED_KEY = 'efootball-admin-dismissed'

function loadChecklist(): ChecklistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveChecklist(items: ChecklistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function loadDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(DISMISSED_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveDismissed(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids))
}

// ─── Severity helpers ───────────────────────────────────────
const severityConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    pill: 'bg-red-500/20 text-red-400',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    pill: 'bg-yellow-500/20 text-yellow-400',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    pill: 'bg-blue-500/20 text-blue-400',
    label: 'Info',
  },
}

const categoryLabels: Record<string, string> = {
  pemain: '👤 Pemain',
  pertandingan: '⚔️ Pertandingan',
  musim: '📅 Musim',
}

// ─── Main Component ─────────────────────────────────────────
export default function ChecklistClient() {
  // Auto-check state
  const [issues, setIssues] = useState<CheckIssue[]>([])
  const [summary, setSummary] = useState<ApiResponse['summary']>({ total: 0, errors: 0, warnings: 0, info: 0 })
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [showDismissed, setShowDismissed] = useState(false)

  // Manual checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // ─── Fetch auto-check data ────────────────────────────────
  const fetchChecks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checklist')
      const data: ApiResponse = await res.json()
      setIssues(data.issues)
      setSummary(data.summary)
    } catch (err) {
      console.error('Failed to fetch checklist:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChecks()
    setChecklist(loadChecklist())
    setDismissed(loadDismissed())
  }, [fetchChecks])

  // ─── Dismissed management ─────────────────────────────────
  const dismissIssue = (id: string) => {
    const updated = [...dismissed, id]
    setDismissed(updated)
    saveDismissed(updated)
  }

  const restoreIssue = (id: string) => {
    const updated = dismissed.filter(d => d !== id)
    setDismissed(updated)
    saveDismissed(updated)
  }

  const restoreAll = () => {
    setDismissed([])
    saveDismissed([])
  }

  const activeIssues = issues.filter(i => !dismissed.includes(i.id))
  const dismissedIssues = issues.filter(i => dismissed.includes(i.id))

  // Group active issues by category
  const groupedIssues = activeIssues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = []
    acc[issue.category].push(issue)
    return acc
  }, {} as Record<string, CheckIssue[]>)

  // ─── Manual checklist management ──────────────────────────
  const addItem = () => {
    if (!newItemText.trim()) return
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [...checklist, newItem]
    setChecklist(updated)
    saveChecklist(updated)
    setNewItemText('')
    setShowAddForm(false)
  }

  const toggleItem = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    setChecklist(updated)
    saveChecklist(updated)
  }

  const deleteItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id)
    setChecklist(updated)
    saveChecklist(updated)
  }

  const resetAll = () => {
    const updated = checklist.map(item => ({ ...item, checked: false }))
    setChecklist(updated)
    saveChecklist(updated)
  }

  const checkedCount = checklist.filter(i => i.checked).length
  const progress = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Auto-check summary */}
        <div className="rounded-xl bg-gradient-to-r from-red-500/15 to-red-900/10 border border-red-500/25 p-4 md:p-5">
          <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Error</p>
          <p className="font-gaming text-2xl md:text-3xl font-bold text-red-400 mt-1">
            {loading ? '…' : summary.errors}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-yellow-500/15 to-yellow-900/10 border border-yellow-500/25 p-4 md:p-5">
          <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warning</p>
          <p className="font-gaming text-2xl md:text-3xl font-bold text-yellow-400 mt-1">
            {loading ? '…' : summary.warnings}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-blue-500/15 to-blue-900/10 border border-blue-500/25 p-4 md:p-5">
          <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Info</p>
          <p className="font-gaming text-2xl md:text-3xl font-bold text-blue-400 mt-1">
            {loading ? '…' : summary.info}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-neon/15 to-neon-blue/10 border border-neon/25 p-4 md:p-5">
          <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist</p>
          <p className="font-gaming text-2xl md:text-3xl font-bold text-neon mt-1">
            {checkedCount}/{checklist.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 xl:gap-8">
        {/* ═══════════════════════════════════════════════════
            AUTO-CHECK PANEL (3/5 width on XL)
            ═══════════════════════════════════════════════════ */}
        <div className="xl:col-span-3 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">Auto-Check</h2>
              {!loading && activeIssues.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                  {activeIssues.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchChecks}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="game-card p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Clear */}
          {!loading && activeIssues.length === 0 && (
            <div className="game-card p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-1">Semua Data Terverifikasi!</h3>
              <p className="text-sm text-muted-foreground">Tidak ditemukan masalah pada data pemain, pertandingan, atau musim.</p>
            </div>
          )}

          {/* Issue groups by category */}
          {!loading && Object.entries(groupedIssues).map(([category, catIssues]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-2">
                {catIssues.map((issue) => {
                  const config = severityConfig[issue.severity]
                  const Icon = config.icon
                  return (
                    <div
                      key={issue.id}
                      className={`game-card p-3 md:p-4 border ${config.bg} transition-all duration-300 hover:translate-y-0`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground text-sm">{issue.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${config.pill}`}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 break-words">{issue.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {issue.link && (
                                <Link
                                  href={issue.link}
                                  className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                                  title="Lihat & Perbaiki"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              <button
                                onClick={() => dismissIssue(issue.id)}
                                className="w-7 h-7 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                                title="Abaikan"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Dismissed section */}
          {dismissedIssues.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowDismissed(!showDismissed)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDismissed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {dismissedIssues.length} issue diabaikan
              </button>
              {showDismissed && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-end">
                    <button
                      onClick={restoreAll}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Kembalikan Semua
                    </button>
                  </div>
                  {dismissedIssues.map((issue) => {
                    const config = severityConfig[issue.severity]
                    const Icon = config.icon
                    return (
                      <div key={issue.id} className="game-card p-3 opacity-50 hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
                          <span className="text-xs text-muted-foreground flex-1 line-through">{issue.title}: {issue.description}</span>
                          <button
                            onClick={() => restoreIssue(issue.id)}
                            className="text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                          >
                            Kembalikan
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            MANUAL CHECKLIST PANEL (2/5 width on XL)
            ═══════════════════════════════════════════════════ */}
        <div className="xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-neon" />
              <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">Checklist Manual</h2>
            </div>
          </div>

          <div className="game-card p-4 md:p-5 space-y-4">
            {/* Progress bar */}
            {checklist.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progres</span>
                  <span className="font-gaming font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon to-neon-blue transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist items */}
            <div className="space-y-1.5">
              {checklist.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada item checklist.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tambahkan item untuk membantu tracking verifikasi.</p>
                </div>
              )}

              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-secondary/50 ${
                    item.checked ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="mt-0.5 shrink-0 transition-transform duration-200 hover:scale-110"
                  >
                    {item.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-neon" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm transition-all duration-200 ${
                      item.checked
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
            {showAddForm ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Tulis item checklist..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <button
                  onClick={addItem}
                  disabled={!newItemText.trim()}
                  className="px-3 py-2 rounded-lg bg-primary/20 text-primary font-semibold text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tambah
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewItemText('') }}
                  className="px-2 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
                {checklist.length > 0 && (
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-secondary border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-all"
                    title="Reset semua centangan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick add suggestions */}
          {checklist.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">Saran item checklist:</p>
              {[
                'Semua jadwal minggu ini sudah benar',
                'Skor pertandingan hari ini sudah diinput',
                'Data pemain baru sudah lengkap',
                'Klasemen sudah terupdate',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const newItem: ChecklistItem = {
                      id: `custom-${Date.now()}-${Math.random()}`,
                      text: suggestion,
                      checked: false,
                      createdAt: new Date().toISOString(),
                    }
                    const updated = [...checklist, newItem]
                    setChecklist(updated)
                    saveChecklist(updated)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-secondary/30 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-primary/20 transition-all flex items-center gap-2"
                >
                  <Plus className="w-3 h-3 text-primary shrink-0" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

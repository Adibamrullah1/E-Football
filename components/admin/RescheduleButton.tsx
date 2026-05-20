'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarClock, X, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RescheduleButtonProps {
  matchId: string
  currentSchedule: string | Date
  matchLabel: string
}

function toWIBDatetimeLocal(date: string | Date): string {
  const d = new Date(date)
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 16)
}

function wibInputToISO(datetimeLocal: string): string {
  const d = new Date(datetimeLocal)
  const utc = new Date(d.getTime() - 7 * 60 * 60 * 1000)
  return utc.toISOString()
}

export default function RescheduleButton({ matchId, currentSchedule, matchLabel }: RescheduleButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(toWIBDatetimeLocal(currentSchedule))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Pastikan sudah di client sebelum render portal
  useEffect(() => { setMounted(true) }, [])

  const handleOpen = () => {
    setValue(toWIBDatetimeLocal(currentSchedule))
    setError('')
    setSuccess(false)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
  }

  const handleSave = async () => {
    if (!value) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: wibInputToISO(value) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan')
      }
      setSuccess(true)
      setTimeout(() => {
        handleClose()
        setSuccess(false)
        router.refresh()
      }, 900)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Modal di-render via Portal langsung ke document.body
  // agar bebas dari overflow:hidden / transform parent admin layout
  const modal = mounted && open ? createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '18px',
        padding: '28px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <CalendarClock style={{ width: '20px', height: '20px', color: '#facc15' }} />
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#f9fafb' }}>Reschedule</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginLeft: '30px' }}>{matchLabel}</p>
          </div>
          <button onClick={handleClose} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            width: '32px', height: '32px',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '22px' }} />

        {/* Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
            Tanggal & Jam Baru{' '}
            <span style={{ color: '#6b7280', fontWeight: 400 }}>(WIB)</span>
          </label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '1px solid rgba(250,204,21,0.25)',
              color: '#f9fafb',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#f87171',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={loading || success || !value}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: (loading || success || !value) ? 'not-allowed' : 'pointer',
              background: success
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(250,204,21,0.18)',
              color: success ? '#4ade80' : '#fde047',
              opacity: (!value || loading) ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              : success
                ? <><Check style={{ width: '16px', height: '16px' }} /> Tersimpan!</>
                : <><CalendarClock style={{ width: '16px', height: '16px' }} /> Simpan Jadwal</>
            }
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '11px 18px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body  // ← Portal: langsung ke body, bypass semua parent
  ) : null

  return (
    <>
      <button
        onClick={handleOpen}
        title="Reschedule jadwal"
        style={{
          width: '32px', height: '32px',
          borderRadius: '8px',
          background: 'rgba(250,204,21,0.12)',
          border: '1px solid rgba(250,204,21,0.2)',
          color: '#facc15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,204,21,0.25)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250,204,21,0.12)')}
      >
        <CalendarClock style={{ width: '14px', height: '14px' }} />
      </button>

      {modal}
    </>
  )
}

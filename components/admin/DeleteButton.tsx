'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  apiUrl: string
  confirmMessage?: string
}

export default function DeleteButton({ apiUrl, confirmMessage = 'Apakah Anda yakin ingin menghapus data ini?' }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      const res = await fetch(apiUrl, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Gagal menghapus data')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors inline-flex disabled:opacity-50"
      title="Hapus"
    >
      <Trash2 className="w-4 h-4 text-inherit" />
    </button>
  )
}

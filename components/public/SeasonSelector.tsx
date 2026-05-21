'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Season {
  id: string
  name: string
  isActive: boolean
}

interface SeasonSelectorProps {
  seasons: Season[]
  currentSeasonId?: string
}

function SeasonSelectorInner({ seasons, currentSeasonId }: SeasonSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('season', e.target.value)
    } else {
      params.delete('season')
    }
    router.push(`?${params.toString()}`)
  }

  if (seasons.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-xl border border-border/50 max-w-[200px]">
      <select
        value={currentSeasonId || ''}
        onChange={handleSeasonChange}
        className="w-full bg-transparent text-sm font-semibold text-foreground px-3 py-1.5 focus:outline-none focus:ring-0 cursor-pointer"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id} className="bg-secondary text-foreground">
            {season.name} {season.isActive ? '(Aktif)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function SeasonSelector(props: SeasonSelectorProps) {
  return (
    <Suspense fallback={<div className="h-9 w-32 bg-secondary/50 animate-pulse rounded-xl" />}>
      <SeasonSelectorInner {...props} />
    </Suspense>
  )
}

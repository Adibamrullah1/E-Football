'use client'

import { Bell, User } from 'lucide-react'

interface AdminHeaderProps {
  session: any
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border/50 bg-gaming-surface/50 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between">
      <div className="pl-12 md:pl-0">
        <h2 className="font-heading text-base md:text-lg font-bold text-foreground truncate">Admin Panel</h2>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Liga eFootball Mobile</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{session?.user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground capitalize">{(session?.user as any)?.role?.toLowerCase().replace('_', ' ') || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

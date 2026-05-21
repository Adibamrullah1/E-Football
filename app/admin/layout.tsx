import { auth } from '@/lib/auth'
import dynamic from 'next/dynamic'

export const runtime = 'nodejs'

const AdminSidebar = dynamic(() => import('@/components/admin/AdminSidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden md:flex flex-col w-64 bg-gaming-surface border-r border-border/50 h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon to-neon-blue animate-pulse shrink-0" />
          <div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-2 w-14 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>
    </aside>
  ),
})

const AdminHeader = dynamic(() => import('@/components/admin/AdminHeader'), {
  ssr: false,
  loading: () => (
    <header className="h-16 border-b border-border/50 bg-gaming-surface/50 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between">
      <div className="pl-12 md:pl-0">
        <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
      </div>
    </header>
  ),
})

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  // Don't apply full admin layout to login page
  // The middleware handles the redirect; layout just renders children
  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gaming-dark overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader session={session} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}

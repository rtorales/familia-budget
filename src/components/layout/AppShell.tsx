'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const AUTH_ROUTES = ['/login', '/registro']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()

  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // Auth pages: full screen, no sidebar
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Authenticated: show sidebar + content
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

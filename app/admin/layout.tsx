'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/admin' as const, icon: '🏠' },
  { name: 'Użytkownicy', href: '/admin/users' as const, icon: '👥' },
  { name: 'Restauracje', href: '/admin/restaurants' as const, icon: '🍽️' },
  { name: 'Audit Log', href: '/admin/audit' as const, icon: '📜' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-800 shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel Administratora</h1>
            <p className="text-sm text-red-100">Gastro Schedules - Support</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 hover:text-red-200"
          >
            🚪 Wyloguj
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation - Desktop */}
        <nav className="hidden min-h-screen w-64 bg-white shadow-md md:block">
          <div className="space-y-2 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-red-100 font-semibold text-red-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto flex-1 p-6">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={`flex flex-col items-center justify-center px-1 py-2 transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                }`}
              >
                <span className="mb-1 text-2xl">{item.icon}</span>
                <span className="w-full truncate text-center text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

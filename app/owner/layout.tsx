'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/owner/dashboard' as const, icon: '🏢' },
  { name: 'Firmy', href: '/owner/companies' as const, icon: '🏭' },
  { name: 'Restauracje', href: '/owner/restaurants' as const, icon: '🍽️' },
  { name: 'Raporty', href: '/owner/reports' as const, icon: '📊' },
  { name: 'Managerowie', href: '/owner/managers' as const, icon: '👔' },
]

export default function OwnerLayout({ children }: { children: ReactNode }) {
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
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel Właściciela</h1>
            <p className="text-sm text-purple-100">Gastro Schedules</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700 hover:text-red-200"
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
                      ? 'bg-purple-100 font-semibold text-purple-700'
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
        <div className="grid grid-cols-5 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={`flex flex-col items-center justify-center px-1 py-2 transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
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

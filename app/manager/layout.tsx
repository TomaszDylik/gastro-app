'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/manager/dashboard', icon: '🏠' },
  { name: 'Czas pracy', href: '/manager/time', icon: '⏱️' },
  { name: 'Grafiki', href: '/manager/schedules', icon: '📅' },
  { name: 'Zespół', href: '/manager/team', icon: '👥' },
  { name: 'Raporty', href: '/manager/reports', icon: '📊' },
  { name: 'Ustawienia', href: '/manager/settings', icon: '⚙️' },
]

export default function ManagerLayout({ children }: { children: ReactNode }) {
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
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-blue-600">Gastro Schedules</h1>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                MANAGER
              </span>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href as any}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                      isActive
                        ? 'bg-blue-100 font-medium text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-red-600"
            >
              <span className="hidden text-sm sm:inline">Wyloguj</span>
              <span>🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={`flex flex-col items-center justify-center px-1 py-2 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <span className="mb-1 text-xl">{item.icon}</span>
                <span className="w-full truncate text-center text-xs font-medium">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pb-20 md:pb-0">{children}</div>
    </div>
  )
}

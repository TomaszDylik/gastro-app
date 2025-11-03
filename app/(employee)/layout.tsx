'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' as const, icon: '🏠' },
  { name: 'Kalendarz', href: '/calendar' as const, icon: '📅' },
  { name: 'Dostępność', href: '/availability' as const, icon: '🗓️' },
  { name: 'Podsumowanie', href: '/summary' as const, icon: '💰' },
  { name: 'Ustawienia', href: '/settings' as const, icon: '⚙️' },
]

export default function EmployeeLayout({ children }: { children: ReactNode }) {
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-blue-600">Gastro Schedules</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 transition-colors hover:text-red-600"
          >
            🚪 Wyloguj
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto">{children}</div>

      {/* Bottom Navigation - Mobile PWA */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center px-1 py-2 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
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

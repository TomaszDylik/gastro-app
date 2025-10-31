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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Gastro Schedules</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            🚪 Wyloguj
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto">
        {children}
      </div>

      {/* Bottom Navigation - Mobile PWA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

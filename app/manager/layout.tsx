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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-blue-600">Gastro Schedules</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                MANAGER
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href as any}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
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
              className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <span className="text-sm hidden sm:inline">Wyloguj</span>
              <span>🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-6 gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}

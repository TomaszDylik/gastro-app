'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  restaurantName?: string
  membershipId?: string
}

interface Stats {
  activeEmployees: number
  pendingApprovals: number
  schedulesCount: number
  todayShifts: number
}

export default function ManagerDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats>({
    activeEmployees: 0,
    pendingApprovals: 0,
    schedulesCount: 0,
    todayShifts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Fetch user data
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) {
        router.push('/login')
        return
      }
      const user = await userResponse.json()
      setUserData(user)

      // TODO: Pobierz statystyki z API
      // Mock stats
      const mockStats: Stats = {
        activeEmployees: 2, // Obecnie w pracy
        pendingApprovals: 3, // Oczekujące zatwierdzenia
        schedulesCount: 3, // Ilość grafików
        todayShifts: 5 // Dzisiejsze zmiany
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Błąd ładowania danych:', error)
    } finally {
      setLoading(false)
    }
  }

  const firstName = userData?.name.split(' ')[0] || 'Managerze'

  if (loading) {
    return (
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Witaj, {firstName}! 👋</h1>
        <div className="flex items-center gap-3">
          <span className="text-xl text-gray-600">{userData?.restaurantName}</span>
          <span className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}
          </span>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100 text-sm">W pracy teraz</span>
            <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse"></div>
          </div>
          <div className="text-4xl font-bold">{stats.activeEmployees}</div>
          <Link 
            href="/manager/time" 
            className="text-red-100 text-sm hover:text-white mt-2 inline-block"
          >
            Zobacz szczegóły →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100 text-sm">Do zatwierdzenia</span>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="text-4xl font-bold">{stats.pendingApprovals}</div>
          <Link 
            href="/manager/time" 
            className="text-yellow-100 text-sm hover:text-white mt-2 inline-block"
          >
            Zatwierdź wpisy →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">Grafiki</span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="text-4xl font-bold">{stats.schedulesCount}<span className="text-xl text-blue-200">/5</span></div>
          <Link 
            href="/manager/schedules" 
            className="text-blue-100 text-sm hover:text-white mt-2 inline-block"
          >
            Zarządzaj →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-sm">Dzisiejsze zmiany</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-4xl font-bold">{stats.todayShifts}</div>
          <Link 
            href="/manager/schedules" 
            className="text-green-100 text-sm hover:text-white mt-2 inline-block"
          >
            Zobacz grafik →
          </Link>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Szybkie akcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/manager/time"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ⏱️
              </div>
              <div>
                <h3 className="font-semibold text-lg">Zarządzaj czasem</h3>
                <p className="text-sm text-gray-600">Zatwierdź wpisy czasu pracy</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/team"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <div>
                <h3 className="font-semibold text-lg">Zespół</h3>
                <p className="text-sm text-gray-600">Zarządzaj pracownikami</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/schedules"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📅
              </div>
              <div>
                <h3 className="font-semibold text-lg">Grafiki</h3>
                <p className="text-sm text-gray-600">Twórz i edytuj grafiki</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/reports"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-lg">Raporty</h3>
                <p className="text-sm text-gray-600">Eksportuj zestawienia</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/team"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ✉️
              </div>
              <div>
                <h3 className="font-semibold text-lg">Zaproszenia</h3>
                <p className="text-sm text-gray-600">Dodaj nowych pracowników</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/settings"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ⚙️
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ustawienia</h3>
                <p className="text-sm text-gray-600">Konfiguracja restauracji</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}

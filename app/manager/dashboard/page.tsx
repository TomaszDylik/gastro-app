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
    todayShifts: 0,
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
        todayShifts: 5, // Dzisiejsze zmiany
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
      <main className="container mx-auto max-w-6xl p-6">
        <div className="animate-pulse">
          <div className="mb-8 h-10 w-64 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Witaj, {firstName}! 👋</h1>
        <div className="flex items-center gap-3">
          <span className="text-xl text-gray-600">{userData?.restaurantName}</span>
          <span className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}
          </span>
        </div>
      </div>

      {/* Statystyki */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-red-100">W pracy teraz</span>
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-300"></div>
          </div>
          <div className="text-4xl font-bold">{stats.activeEmployees}</div>
          <Link
            href="/manager/time"
            className="mt-2 inline-block text-sm text-red-100 hover:text-white"
          >
            Zobacz szczegóły →
          </Link>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-yellow-100">Do zatwierdzenia</span>
            <span className="text-2xl">⏳</span>
          </div>
          <div className="text-4xl font-bold">{stats.pendingApprovals}</div>
          <Link
            href="/manager/time"
            className="mt-2 inline-block text-sm text-yellow-100 hover:text-white"
          >
            Zatwierdź wpisy →
          </Link>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-blue-100">Grafiki</span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="text-4xl font-bold">
            {stats.schedulesCount}
            <span className="text-xl text-blue-200">/5</span>
          </div>
          <Link
            href="/manager/schedules"
            className="mt-2 inline-block text-sm text-blue-100 hover:text-white"
          >
            Zarządzaj →
          </Link>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-green-100">Dzisiejsze zmiany</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-4xl font-bold">{stats.todayShifts}</div>
          <Link
            href="/manager/schedules"
            className="mt-2 inline-block text-sm text-green-100 hover:text-white"
          >
            Zobacz grafik →
          </Link>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Szybkie akcje</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/manager/time"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-2xl transition-transform group-hover:scale-110">
                ⏱️
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zarządzaj czasem</h3>
                <p className="text-sm text-gray-600">Zatwierdź wpisy czasu pracy</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/team"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl transition-transform group-hover:scale-110">
                👥
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zespół</h3>
                <p className="text-sm text-gray-600">Zarządzaj pracownikami</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/schedules"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl transition-transform group-hover:scale-110">
                📅
              </div>
              <div>
                <h3 className="text-lg font-semibold">Grafiki</h3>
                <p className="text-sm text-gray-600">Twórz i edytuj grafiki</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/reports"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl transition-transform group-hover:scale-110">
                📊
              </div>
              <div>
                <h3 className="text-lg font-semibold">Raporty</h3>
                <p className="text-sm text-gray-600">Eksportuj zestawienia</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/team"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 text-2xl transition-transform group-hover:scale-110">
                ✉️
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zaproszenia</h3>
                <p className="text-sm text-gray-600">Dodaj nowych pracowników</p>
              </div>
            </div>
          </Link>

          <Link
            href="/manager/settings"
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl transition-transform group-hover:scale-110">
                ⚙️
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ustawienia</h3>
                <p className="text-sm text-gray-600">Konfiguracja restauracji</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}

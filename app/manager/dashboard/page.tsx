'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

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

interface ActiveShift {
  id: string
  employeeName: string
  role: string
  startTime: string
  endTime: string
  status: 'on-time' | 'late' | 'early'
}

export default function ManagerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }

      const user = await res.json()
      
      if (user.role !== 'manager') {
        if (user.role === 'employee') router.push('/dashboard')
        else if (user.role === 'owner') router.push('/owner/dashboard')
        else if (user.role === 'admin') router.push('/admin')
        return
      }

      setUserData(user)
    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const stats: Stats = {
    activeEmployees: 12,
    pendingApprovals: 5,
    schedulesCount: 3,
    todayShifts: 8
  }

  const activeShifts: ActiveShift[] = [
    { id: '1', employeeName: 'Anna Kowalska', role: 'Kelnerka', startTime: '09:00', endTime: '17:00', status: 'on-time' },
    { id: '2', employeeName: 'Jan Nowak', role: 'Kucharz', startTime: '08:00', endTime: '16:00', status: 'on-time' },
    { id: '3', employeeName: 'Maria Wiśniewska', role: 'Barista', startTime: '10:00', endTime: '18:00', status: 'late' },
  ]

  const quickActions = [
    { icon: '✅', title: 'Zatwierdź czas', path: '/manager/time', color: 'from-green-500 to-emerald-500' },
    { icon: '📅', title: 'Grafiki', path: '/manager/schedules', color: 'from-purple-500 to-indigo-500' },
    { icon: '👥', title: 'Zespół', path: '/manager/team', color: 'from-orange-500 to-amber-500' },
    { icon: '📊', title: 'Raporty', path: '/manager/reports', color: 'from-blue-500 to-cyan-500' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="mb-4 text-6xl animate-pulse">⏳</div>
          <div className="text-xl font-bold text-gray-900">Ładowanie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-4xl font-bold text-transparent">
              Panel Menedżera 👨‍💼
            </h1>
            <p className="text-gray-600">
              Witaj, {userData?.name || 'Menedżer'}! {userData?.restaurantName && `• ${userData.restaurantName}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-gray-600">
              {format(currentTime, 'EEEE, d MMMM yyyy', { locale: pl })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Aktywni pracownicy"
            value={stats.activeEmployees}
            icon="👥"
            trend={{ value: 2, direction: 'up' }}
            variant="gradient"
          />
          <StatCard
            title="Do zatwierdzenia"
            value={stats.pendingApprovals}
            icon="⏳"
            trend={{ value: 1, direction: 'down' }}
            variant="gradient"
          />
          <StatCard
            title="Grafiki"
            value={stats.schedulesCount}
            icon="📅"
            variant="gradient"
          />
          <StatCard
            title="Dzisiejsze zmiany"
            value={stats.todayShifts}
            icon="📋"
            variant="gradient"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="glass">
            <CardHeader>
              <h2 className="text-2xl font-bold">🔥 Aktywne zmiany</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {activeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-xl bg-white/60 p-4 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{shift.employeeName}</div>
                        <div className="text-sm text-gray-600">{shift.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {shift.startTime} - {shift.endTime}
                      </div>
                      <Badge
                        variant={shift.status === 'on-time' ? 'success' : shift.status === 'late' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {shift.status === 'on-time' ? '✅ Na czas' : shift.status === 'late' ? '⚠️ Spóźniony' : '🔵 Wcześnie'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <h2 className="text-2xl font-bold">⚡ Szybkie akcje</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => router.push(action.path as any)}
                    className={`rounded-xl bg-gradient-to-br ${action.color} p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
                  >
                    <div className="mb-2 text-4xl">{action.icon}</div>
                    <div className="font-bold">{action.title}</div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">📊 Dzisiejsze podsumowanie</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                <div className="mb-2 text-3xl">⏰</div>
                <div className="text-2xl font-bold text-gray-900">42.5h</div>
                <div className="text-sm text-gray-600">Przepracowane godziny</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                <div className="mb-2 text-3xl">✅</div>
                <div className="text-2xl font-bold text-gray-900">8/8</div>
                <div className="text-sm text-gray-600">Obecność</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="mb-2 text-3xl">💰</div>
                <div className="text-2xl font-bold text-gray-900">1,487 zł</div>
                <div className="text-sm text-gray-600">Koszty pracy</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

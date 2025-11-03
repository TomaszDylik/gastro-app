/**
 * Futurystyczny Owner Dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

export default function OwnerDashboard() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const stats = {
    restaurants: 3,
    totalEmployees: 47,
    activeShifts: 12,
    pendingReports: 2,
  }

  const restaurants = [
    { id: '1', name: 'Gastro Centrum', employees: 18, shifts: 5, status: 'active' },
    { id: '2', name: 'Gastro Plaza', employees: 15, shifts: 4, status: 'active' },
    { id: '3', name: 'Gastro Park', employees: 14, shifts: 3, status: 'active' },
  ]

  const quickActions = [
    { icon: '🏢', label: 'Dodaj firmę', path: '/owner/companies/add', color: 'from-blue-500 to-cyan-500' },
    { icon: '🏪', label: 'Restauracje', path: '/owner/restaurants', color: 'from-purple-500 to-pink-500' },
    { icon: '👔', label: 'Managerowie', path: '/owner/managers', color: 'from-orange-500 to-red-500' },
    { icon: '📊', label: 'Raporty tyg.', path: '/owner/reports/weekly', color: 'from-green-500 to-emerald-500' },
    { icon: '📈', label: 'Raporty mies.', path: '/owner/reports/monthly', color: 'from-violet-500 to-purple-500' },
    { icon: '⚙️', label: 'Ustawienia', path: '/owner/settings', color: 'from-gray-600 to-gray-800' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Panel Właściciela 👑
            </h1>
            <p className="text-lg text-gray-600">
              {format(currentTime, 'EEEE, d MMMM yyyy', { locale: pl })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">{format(currentTime, 'HH:mm')}</div>
            <div className="text-sm text-gray-500">{format(currentTime, 'ss')} sec</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Restauracje" value={stats.restaurants} icon="🏪" variant="glass" />
          <StatCard title="Pracownicy" value={stats.totalEmployees} icon="👥" trend={{ value: 5, direction: 'up' }} variant="glass" />
          <StatCard title="Aktywne zmiany" value={stats.activeShifts} icon="📅" variant="glass" />
          <StatCard title="Raporty oczekujące" value={stats.pendingReports} icon="📊" variant="glass" />
        </div>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🏪 Twoje restauracje</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {restaurants.map((rest) => (
                <div key={rest.id} className="flex items-center justify-between rounded-xl bg-white/60 p-6 backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-lg cursor-pointer"
                  onClick={() => router.push(`/owner/restaurants/${rest.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl shadow-lg">
                      🏪
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{rest.name}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">👥 {rest.employees} pracowników</span>
                        <span className="text-sm text-gray-600">📅 {rest.shifts} aktywnych zmian</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" glow>{rest.status === 'active' ? '✅ Aktywna' : '⏸️ Nieaktywna'}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">⚡ Szybkie akcje</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Card key={action.path} variant="glass" hover glow className="cursor-pointer" onClick={() => router.push(action.path)}>
                <CardBody className="text-center">
                  <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} text-3xl text-white shadow-lg`}>
                    {action.icon}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{action.label}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="gradient">
            <CardHeader>
              <h2 className="text-2xl font-bold">📊 Statystyki tygodnia</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Suma godzin', value: '647.5h', trend: '+12%', icon: '⏱️' },
                  { label: 'Koszt pracy', value: '24,567 zł', trend: '+8%', icon: '💰' },
                  { label: 'Zatwierdzonych raportów', value: '12', trend: '100%', icon: '✅' },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{stat.icon}</span>
                      <div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">{stat.trend}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <h2 className="text-2xl font-bold">👔 Top managerowie</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { name: 'Katarzyna Lewandowska', restaurant: 'Gastro Centrum', score: '98%' },
                  { name: 'Michał Kowalczyk', restaurant: 'Gastro Plaza', score: '95%' },
                  { name: 'Agnieszka Wójcik', restaurant: 'Gastro Park', score: '92%' },
                ].map((manager, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{manager.name}</div>
                        <div className="text-xs text-gray-600">{manager.restaurant}</div>
                      </div>
                    </div>
                    <Badge variant="manager">{manager.score}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

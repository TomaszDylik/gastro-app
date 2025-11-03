/**
 * Futurystyczny Admin Panel
 */

'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

export default function AdminPanel() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const systemStats = {
    totalUsers: 247,
    totalCompanies: 18,
    totalRestaurants: 42,
    totalEmployees: 489,
    activeShifts: 87,
    systemHealth: 99.8,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Panel Administratora 🔧
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

        <Card variant="neon" className="border-2">
          <CardBody className="text-center">
            <div className="mb-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-5xl shadow-2xl shadow-green-500/50 animate-pulse">
                ✅
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">{systemStats.systemHealth}%</div>
            <div className="text-purple-200">System Health - Wszystko działa prawidłowo</div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Użytkownicy" value={systemStats.totalUsers} icon="👤" trend={{ value: 15, direction: 'up' }} variant="glass" />
          <StatCard title="Firmy" value={systemStats.totalCompanies} icon="🏢" trend={{ value: 2, direction: 'up' }} variant="glass" />
          <StatCard title="Restauracje" value={systemStats.totalRestaurants} icon="🏪" trend={{ value: 5, direction: 'up' }} variant="glass" />
          <StatCard title="Pracownicy" value={systemStats.totalEmployees} icon="👥" trend={{ value: 12, direction: 'up' }} variant="glass" />
          <StatCard title="Aktywne zmiany" value={systemStats.activeShifts} icon="📅" variant="glass" />
          <StatCard title="Uptime" value="99.9%" icon="⏱️" trend={{ value: 0.1, direction: 'up' }} variant="glass" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="glass">
            <CardHeader>
              <h2 className="text-2xl font-bold">🗄️ Baza danych</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { table: 'AppUser', count: 247, size: '1.2 MB' },
                  { table: 'TimeEntry', count: 8547, size: '15.8 MB' },
                  { table: 'Schedule', count: 2341, size: '4.5 MB' },
                  { table: 'DailyReport', count: 892, size: '12.3 MB' },
                  { table: 'Membership', count: 489, size: '0.8 MB' },
                ].map((table, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/60 p-3">
                    <div>
                      <div className="font-semibold font-mono">{table.table}</div>
                      <div className="text-sm text-gray-600">{table.count} rekordów</div>
                    </div>
                    <Badge variant="info" size="sm">{table.size}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <h2 className="text-2xl font-bold">📊 Ostatnia aktywność</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { action: 'Nowa rejestracja', user: 'jan.kowalski@example.com', time: '2 min temu', type: 'success' },
                  { action: 'Zatwierdzono raport', user: 'Manager #12', time: '15 min temu', type: 'info' },
                  { action: 'Dodano restaurację', user: 'Owner #3', time: '1h temu', type: 'success' },
                  { action: 'Błąd logowania', user: 'anna.nowak@example.com', time: '2h temu', type: 'warning' },
                  { action: 'Wygenerowano raport', user: 'System', time: '3h temu', type: 'info' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-lg bg-white/60 p-3">
                    <Badge variant={activity.type as any} size="sm">•</Badge>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{activity.action}</div>
                      <div className="text-xs text-gray-600">{activity.user}</div>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card variant="gradient">
          <CardHeader>
            <h2 className="text-2xl font-bold">🔐 Bezpieczeństwo & Audyt</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { label: 'Nieudane logowania (24h)', value: '3', icon: '🚫', status: 'success' },
                { label: 'Sesje aktywne', value: '47', icon: '🔓', status: 'info' },
                { label: 'Ostatni backup', value: '2h temu', icon: '💾', status: 'success' },
              ].map((metric, idx) => (
                <div key={idx} className="rounded-lg bg-white/50 p-4 text-center">
                  <div className="mb-2 text-4xl">{metric.icon}</div>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

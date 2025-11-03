'use client'

import { useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

export default function SummaryPage() {
  const [currentMonth] = useState(new Date())

  const summary = {
    totalHours: 167.5,
    approvedHours: 152.0,
    pendingHours: 15.5,
    hourlyRate: 35.0,
    estimatedEarnings: 5337.5,
    approvedEarnings: 5320.0,
  }

  const weeklyData = [
    { week: 'Tydzień 1', hours: 42.5, earnings: 1487.5, status: 'approved' },
    { week: 'Tydzień 2', hours: 40.0, earnings: 1400.0, status: 'approved' },
    { week: 'Tydzień 3', hours: 38.0, earnings: 1330.0, status: 'approved' },
    { week: 'Tydzień 4', hours: 39.0, earnings: 1365.0, status: 'approved' },
    { week: 'Tydzień 5', hours: 8.0, earnings: 280.0, status: 'pending' },
  ]

  const recentEntries = [
    { date: '2025-11-03', clockIn: '09:00', clockOut: '17:30', hours: 8.5, status: 'pending' },
    { date: '2025-11-02', clockIn: '09:15', clockOut: '17:45', hours: 8.5, status: 'approved' },
    { date: '2025-11-01', clockIn: '09:00', clockOut: '17:00', hours: 8.0, status: 'approved' },
    { date: '2025-10-31', clockIn: '09:30', clockOut: '17:30', hours: 8.0, status: 'approved' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
            Podsumowanie 💰
          </h1>
          <p className="text-gray-600">{format(startOfMonth(currentMonth), 'LLLL yyyy', { locale: pl })}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Suma godzin" value={`${summary.totalHours}h`} icon="⏱️" trend={{ value: 5, direction: 'up' }} variant="glass" />
          <StatCard title="Zatwierdzone" value={`${summary.approvedHours}h`} icon="✅" variant="glass" />
          <StatCard title="Oczekujące" value={`${summary.pendingHours}h`} icon="⏳" variant="glass" />
        </div>

        <Card variant="gradient">
          <CardHeader>
            <h2 className="text-2xl font-bold">💵 Szacowane zarobki</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-white/60 p-6">
                <div className="text-sm text-gray-600 mb-2">Stawka godzinowa</div>
                <div className="text-4xl font-bold text-green-600 mb-1">{summary.hourlyRate.toFixed(2)} zł</div>
                <div className="text-xs text-gray-500">za godzinę</div>
              </div>
              <div className="rounded-xl bg-white/60 p-6">
                <div className="text-sm text-gray-600 mb-2">Zatwierdzone zarobki</div>
                <div className="text-4xl font-bold text-blue-600 mb-1">{summary.approvedEarnings.toFixed(2)} zł</div>
                <div className="text-xs text-gray-500">{summary.approvedHours}h × {summary.hourlyRate} zł</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">📊 Podsumowanie tygodniowe</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {weeklyData.map((week, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                  <div>
                    <div className="font-bold text-gray-900">{week.week}</div>
                    <div className="text-sm text-gray-600">{week.hours}h przepracowane</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{week.earnings.toFixed(2)} zł</div>
                    <Badge variant={week.status === 'approved' ? 'success' : 'warning'} size="sm">
                      {week.status === 'approved' ? '✅ Zatwierdzone' : '⏳ Oczekuje'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">📝 Ostatnie wpisy</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {recentEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-white/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{entry.status === 'approved' ? '✅' : '⏳'}</div>
                    <div>
                      <div className="font-semibold">{format(new Date(entry.date), 'd MMM yyyy', { locale: pl })}</div>
                      <div className="text-sm text-gray-600">{entry.clockIn} - {entry.clockOut}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{entry.hours.toFixed(1)}h</div>
                    <div className="text-sm text-gray-600">{(entry.hours * summary.hourlyRate).toFixed(2)} zł</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

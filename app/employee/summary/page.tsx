'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

type SummaryData = {
  summary: {
    totalHours: number
    approvedHours: number
    pendingHours: number
    hourlyRate: number
    estimatedEarnings: number
    approvedEarnings: number
  }
  weeklyData: Array<{
    week: string
    hours: number
    earnings: number
    status: string
  }>
  recentEntries: Array<{
    date: string
    clockIn: string
    clockOut: string | null
    hours: number | null
    earnings: number | null
    status: string
    scheduleName: string
  }>
  month: string
}

export default function SummaryPage() {
  const [currentMonth] = useState(new Date())
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipId, setMembershipId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        // Get current user
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          throw new Error('Failed to load user data')
        }
        const userData = await userRes.json()
        setMembershipId(userData.membershipId)

        // Fetch summary data
        const monthParam = format(currentMonth, 'yyyy-MM')
        const summaryRes = await fetch(
          `/api/time-entries/summary?membershipId=${userData.membershipId}&month=${monthParam}`
        )
        
        if (!summaryRes.ok) {
          throw new Error('Failed to load summary data')
        }
        
        const summaryData = await summaryRes.json()
        setData(summaryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [currentMonth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Ładowanie podsumowania...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 flex items-center justify-center">
        <Card variant="glass" className="max-w-md">
          <CardBody>
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <div className="text-xl font-semibold text-red-600 mb-2">Błąd ładowania</div>
              <div className="text-gray-600">{error || 'Nie udało się załadować danych'}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const { summary, weeklyData, recentEntries } = data

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
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <div>Brak wpisów w tym miesiącu</div>
                </div>
              ) : (
                recentEntries.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{entry.status === 'approved' ? '✅' : entry.status === 'pending' ? '⏳' : '🔄'}</div>
                      <div>
                        <div className="font-semibold">{format(new Date(entry.date), 'd MMM yyyy', { locale: pl })}</div>
                        <div className="text-sm text-gray-600">
                          {entry.clockIn} - {entry.clockOut || 'w trakcie'}
                        </div>
                        <div className="text-xs text-gray-500">{entry.scheduleName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.hours !== null ? (
                        <>
                          <div className="font-bold text-lg">{entry.hours.toFixed(1)}h</div>
                          <div className="text-sm text-gray-600">{(entry.hours * summary.hourlyRate).toFixed(2)} zł</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">w trakcie</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

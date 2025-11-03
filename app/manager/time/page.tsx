'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface TimeEntry {
  id: string
  employeeName: string
  clockIn: string
  clockOut: string
  totalHours: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function TimeApprovalPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      employeeName: 'Anna Kowalska',
      clockIn: '09:15',
      clockOut: '17:20',
      totalHours: 8.08,
      date: '2025-11-03',
      status: 'pending',
    },
    {
      id: '2',
      employeeName: 'Jan Nowak',
      clockIn: '10:00',
      clockOut: '18:05',
      totalHours: 8.08,
      date: '2025-11-03',
      status: 'pending',
    },
    {
      id: '3',
      employeeName: 'Maria Wiśniewska',
      clockIn: '08:30',
      clockOut: '16:45',
      totalHours: 8.25,
      date: '2025-11-03',
      status: 'pending',
    },
  ])

  const handleApprove = async (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e))
  }

  const handleReject = async (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const } : e))
  }

  const pendingEntries = entries.filter(e => e.status === 'pending')
  const processedEntries = entries.filter(e => e.status !== 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            Zatwierdzanie czasu ⏱️
          </h1>
          <p className="text-gray-600">Sprawdź i zatwierdź wpisy czasu pracy</p>
        </div>

        {pendingEntries.length > 0 ? (
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">⏳ Do zatwierdzenia</h2>
                <Badge variant="warning" glow>{pendingEntries.length} wpisów</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-white/60 p-6 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                          {entry.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">{entry.employeeName}</div>
                          <div className="text-sm text-gray-600">{format(new Date(entry.date), 'd MMMM yyyy', { locale: pl })}</div>
                        </div>
                      </div>
                      <Badge variant="warning">Do zatwierdzenia</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-xs text-blue-600 font-semibold">Wejście</div>
                        <div className="text-2xl font-bold text-blue-900">{entry.clockIn}</div>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <div className="text-xs text-red-600 font-semibold">Wyjście</div>
                        <div className="text-2xl font-bold text-red-900">{entry.clockOut}</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="text-xs text-green-600 font-semibold">Suma</div>
                        <div className="text-2xl font-bold text-green-900">{entry.totalHours.toFixed(2)}h</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="success"
                        onClick={() => handleApprove(entry.id)}
                        leftIcon={<span>✅</span>}
                        className="flex-1"
                      >
                        Zatwierdź
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(entry.id)}
                        leftIcon={<span>❌</span>}
                        className="flex-1"
                      >
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card variant="glass">
            <CardBody className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Wszystko zatwierdzone!</h3>
              <p className="text-gray-600">Brak wpisów czasu oczekujących na zatwierdzenie</p>
            </CardBody>
          </Card>
        )}

        {processedEntries.length > 0 && (
          <Card variant="gradient">
            <CardHeader>
              <h2 className="text-2xl font-bold">📝 Przetworzone</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {processedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {entry.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold">{entry.employeeName}</div>
                        <div className="text-sm text-gray-600">{entry.clockIn} - {entry.clockOut} ({entry.totalHours.toFixed(2)}h)</div>
                      </div>
                    </div>
                    <Badge variant={entry.status === 'approved' ? 'success' : 'danger'}>
                      {entry.status === 'approved' ? '✅ Zatwierdzono' : '❌ Odrzucono'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

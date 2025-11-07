'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/lib/toast'

interface TimeEntry {
  id: string
  employeeName: string
  employeeId: string
  clockIn: string
  clockOut: string | null
  totalHours: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
  scheduleName: string
  adjustmentMinutes: number
}

export default function TimeApprovalPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserAndEntries = async () => {
      try {
        // Get current user
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          throw new Error('Failed to load user data')
        }
        const userData = await userRes.json()
        
        if (userData.role !== 'manager') {
          throw new Error('Access denied: Manager role required')
        }

        setRestaurantId(userData.restaurantId)

        // Fetch pending entries
        const entriesRes = await fetch(`/api/time-entries/pending?restaurantId=${userData.restaurantId}`)
        if (!entriesRes.ok) {
          throw new Error('Failed to load time entries')
        }
        const entriesData = await entriesRes.json()
        setEntries(entriesData.entries || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadUserAndEntries()
  }, [])

  const handleApprove = async (id: string) => {
    if (processingId) return // Prevent multiple clicks

    const entry = entries.find(e => e.id === id)
    if (!entry) return

    setProcessingId(id)
    try {
      const res = await fetch('/api/time-entries/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: id,
          approved: true,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to approve entry')
      }

      // Update local state
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const } : e))
      
      // Show success toast
      showToast.success('Wpis zatwierdzony', `${entry.employeeName} - ${entry.totalHours.toFixed(2)}h`)
    } catch (err) {
      showToast.error('Błąd zatwierdzania', err instanceof Error ? err.message : 'Nie udało się zatwierdzić wpisu')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (processingId) return // Prevent multiple clicks

    const entry = entries.find(e => e.id === id)
    if (!entry) return

    const reason = window.prompt('Powód odrzucenia (opcjonalnie):')
    if (reason === null) return // User cancelled
    
    setProcessingId(id)
    try {
      const res = await fetch('/api/time-entries/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: id,
          approved: false,
          reason: reason || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to reject entry')
      }

      // Update local state
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const } : e))
      
      // Show success toast
      showToast.warning('Wpis odrzucony', `${entry.employeeName}${reason ? ` - ${reason}` : ''}`)
    } catch (err) {
      showToast.error('Błąd odrzucania', err instanceof Error ? err.message : 'Nie udało się odrzucić wpisu')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-2xl font-semibold text-gray-700">Ładowanie wpisów...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <Card variant="glass" className="max-w-md">
          <CardBody className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Błąd</h3>
            <p className="text-gray-700">{error}</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  const pendingEntries = entries.filter(e => e.status === 'pending')
  const processedEntries = entries.filter(e => e.status !== 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-4xl font-bold text-transparent">
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
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-2xl">
                          {entry.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">{entry.employeeName}</div>
                          <div className="text-sm text-gray-600">
                            {format(parseISO(entry.date), 'd MMMM yyyy', { locale: pl })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.scheduleName}
                            {entry.adjustmentMinutes !== 0 && (
                              <span className="ml-2 text-orange-600">
                                ({entry.adjustmentMinutes > 0 ? '+' : ''}{entry.adjustmentMinutes} min korekty)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="warning">Do zatwierdzenia</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-xs text-blue-600 font-semibold">Wejście</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {format(parseISO(entry.clockIn), 'HH:mm')}
                        </div>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <div className="text-xs text-red-600 font-semibold">Wyjście</div>
                        <div className="text-2xl font-bold text-red-900">
                          {entry.clockOut ? format(parseISO(entry.clockOut), 'HH:mm') : '-'}
                        </div>
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
                        disabled={processingId === entry.id}
                      >
                        {processingId === entry.id ? 'Zatwierdzanie...' : 'Zatwierdź'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(entry.id)}
                        leftIcon={<span>❌</span>}
                        className="flex-1"
                        disabled={processingId === entry.id}
                      >
                        {processingId === entry.id ? 'Odrzucanie...' : 'Odrzuć'}
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
              <h2 className="text-2xl font-bold">📝 Przetworzone w tej sesji</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {processedEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                        {entry.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold">{entry.employeeName}</div>
                        <div className="text-sm text-gray-600">
                          {format(parseISO(entry.clockIn), 'HH:mm')} - {entry.clockOut ? format(parseISO(entry.clockOut), 'HH:mm') : '-'} ({entry.totalHours.toFixed(2)}h)
                        </div>
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

'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Shift {
  id: string
  assignmentId: string
  date: string
  start: string
  end: string
  role: string
  scheduleName: string
  status: 'assigned' | 'declined' | 'completed'
  notes?: string | null
}

interface ShiftsData {
  shifts: Shift[]
  stats: {
    total: number
    confirmed: number
    pending: number
    declined: number
    plannedHours: number
  }
  month: string
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [data, setData] = useState<ShiftsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipId, setMembershipId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserAndShifts = async () => {
      setLoading(true)
      try {
        // Get current user
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          throw new Error('Failed to load user data')
        }
        const userData = await userRes.json()
        setMembershipId(userData.membershipId)

        // Fetch shifts data
        const monthParam = format(currentMonth, 'yyyy-MM')
        const shiftsRes = await fetch(
          `/api/shifts?membershipId=${userData.membershipId}&month=${monthParam}`
        )

        if (!shiftsRes.ok) {
          throw new Error('Failed to load shifts data')
        }

        const shiftsData = await shiftsRes.json()
        setData(shiftsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadUserAndShifts()
  }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']

  const getShiftForDay = (date: Date) => {
    if (!data) return null
    return data.shifts.find(s => s.date === format(date, 'yyyy-MM-dd'))
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Ładowanie kalendarza...</div>
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
              <div className="text-gray-600">{error || 'Nie udało się załadować kalendarza'}</div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const { shifts, stats } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
              Kalendarz 📅
            </h1>
            <p className="text-gray-600">Twoje zaplanowane zmiany</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={previousMonth}>◀</Button>
            <div className="text-xl font-bold">{format(currentMonth, 'LLLL yyyy', { locale: pl })}</div>
            <Button variant="ghost" onClick={nextMonth}>▶</Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card variant="glass">
          <CardBody>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map(day => {
                const shift = getShiftForDay(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const today = isToday(day)

                return (
                  <div
                    key={day.toString()}
                    className={`
                      min-h-[100px] p-2 rounded-lg border transition-all
                      ${!isCurrentMonth ? 'bg-gray-100/50 border-gray-200' : 'bg-white/60 border-white/40'}
                      ${today ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                      ${shift ? 'hover:shadow-xl cursor-pointer' : ''}
                    `}
                  >
                    <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-gray-400' : today ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>

                    {shift && isCurrentMonth && (
                      <div className="space-y-1">
                        <Badge
                          variant={
                            shift.status === 'completed' || shift.status === 'assigned'
                              ? 'success'
                              : shift.status === 'declined'
                                ? 'danger'
                                : 'warning'
                          }
                          size="sm"
                          className="w-full justify-center"
                        >
                          {shift.role}
                        </Badge>
                        <div className="text-xs text-gray-600 font-mono">
                          {shift.start}-{shift.end}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.confirmed}
              </div>
              <div className="text-sm text-gray-600">Potwierdzone zmiany</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">Oczekujące</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.plannedHours}h
              </div>
              <div className="text-sm text-gray-600">Zaplanowane godziny</div>
            </CardBody>
          </Card>
        </div>

        {/* Upcoming Shifts List */}
        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">📋 Nadchodzące zmiany</h2>
          </CardHeader>
          <CardBody>
            {shifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <div>Brak zaplanowanych zmian w tym miesiącu</div>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.slice(0, 5).map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {format(new Date(shift.date), 'd')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{format(new Date(shift.date), 'EEEE, d MMMM', { locale: pl })}</div>
                        <div className="text-sm text-gray-600">{shift.start} - {shift.end} • {shift.role}</div>
                        {shift.notes && (
                          <div className="text-xs text-gray-500 mt-1">{shift.notes}</div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        shift.status === 'completed' || shift.status === 'assigned'
                          ? 'success'
                          : shift.status === 'declined'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {shift.status === 'completed'
                        ? '✅ Ukończona'
                        : shift.status === 'assigned'
                          ? '📌 Przypisana'
                          : '❌ Odrzucona'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

'use client''use client'export default function CalendarPage() {



import { useState, useEffect } from 'react'  return (

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'

import { pl } from 'date-fns/locale'import { useState } from 'react'    <main className="container mx-auto p-4">

import { Card, CardBody, CardHeader } from '@/components/ui/Card'

import { Badge } from '@/components/ui/Badge'import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'      <h1 className="mb-2 text-xl font-semibold">Calendar</h1>

import { Button } from '@/components/ui/Button'

import { pl } from 'date-fns/locale'      <p className="text-gray-600">Widok pracownika — placeholder.</p>

interface Shift {

  id: stringimport { Card, CardBody, CardHeader } from '@/components/ui/Card'    </main>

  assignmentId: string

  date: stringimport { Badge } from '@/components/ui/Badge'  )

  start: string

  end: stringimport { Button } from '@/components/ui/Button'}

  role: string

  scheduleName: string

  status: 'assigned' | 'declined' | 'completed'interface Shift {

  notes?: string | null  date: string

}  start: string

  end: string

interface ShiftsData {  role: string

  shifts: Shift[]  status: 'confirmed' | 'pending' | 'cancelled'

  stats: {}

    total: number

    confirmed: numberexport default function CalendarPage() {

    pending: number  const [currentMonth, setCurrentMonth] = useState(new Date())

    declined: number  

    plannedHours: number  const shifts: Shift[] = [

  }    { date: '2025-11-03', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'confirmed' },

  month: string    { date: '2025-11-04', start: '10:00', end: '18:00', role: 'Kelnerka', status: 'confirmed' },

}    { date: '2025-11-05', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'pending' },

    { date: '2025-11-07', start: '12:00', end: '20:00', role: 'Barista', status: 'confirmed' },

export default function CalendarPage() {    { date: '2025-11-10', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'confirmed' },

  const [currentMonth, setCurrentMonth] = useState(new Date())  ]

  const [data, setData] = useState<ShiftsData | null>(null)

  const [loading, setLoading] = useState(true)  const monthStart = startOfMonth(currentMonth)

  const [error, setError] = useState<string | null>(null)  const monthEnd = endOfMonth(currentMonth)

  const [membershipId, setMembershipId] = useState<string | null>(null)  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })

    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  useEffect(() => {  

    const loadUserAndShifts = async () => {  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

      setLoading(true)  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']

      try {

        // Get current user  const getShiftForDay = (date: Date) => {

        const userRes = await fetch('/api/auth/me')    return shifts.find(s => s.date === format(date, 'yyyy-MM-dd'))

        if (!userRes.ok) {  }

          throw new Error('Failed to load user data')

        }  const previousMonth = () => {

        const userData = await userRes.json()    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))

        setMembershipId(userData.membershipId)  }



        // Fetch shifts data  const nextMonth = () => {

        const monthParam = format(currentMonth, 'yyyy-MM')    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

        const shiftsRes = await fetch(  }

          `/api/shifts?membershipId=${userData.membershipId}&month=${monthParam}`

        )  return (

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">

        if (!shiftsRes.ok) {      <div className="mx-auto max-w-7xl space-y-6">

          throw new Error('Failed to load shifts data')        <div className="flex items-center justify-between">

        }          <div>

                    <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">

        const shiftsData = await shiftsRes.json()              Kalendarz 📅

        setData(shiftsData)            </h1>

      } catch (err) {            <p className="text-gray-600">Twoje zaplanowane zmiany</p>

        setError(err instanceof Error ? err.message : 'Unknown error')          </div>

      } finally {          <div className="flex items-center gap-3">

        setLoading(false)            <Button variant="ghost" onClick={previousMonth}>◀</Button>

      }            <div className="text-xl font-bold">{format(currentMonth, 'LLLL yyyy', { locale: pl })}</div>

    }            <Button variant="ghost" onClick={nextMonth}>▶</Button>

          </div>

    loadUserAndShifts()        </div>

  }, [currentMonth])

        <Card variant="glass">

  const monthStart = startOfMonth(currentMonth)          <CardBody>

  const monthEnd = endOfMonth(currentMonth)            <div className="grid grid-cols-7 gap-2 mb-4">

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })              {weekDays.map(day => (

  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })                <div key={day} className="text-center font-semibold text-gray-600 text-sm p-2">

                    {day}

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })                </div>

  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']              ))}

            </div>

  const getShiftForDay = (date: Date) => {            

    if (!data) return null            <div className="grid grid-cols-7 gap-2">

    return data.shifts.find(s => s.date === format(date, 'yyyy-MM-dd'))              {days.map(day => {

  }                const shift = getShiftForDay(day)

                const isCurrentMonth = isSameMonth(day, currentMonth)

  const previousMonth = () => {                const today = isToday(day)

    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))                

  }                return (

                  <div

  const nextMonth = () => {                    key={day.toString()}

    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))                    className={`

  }                      min-h-[100px] p-2 rounded-lg border transition-all

                      ${!isCurrentMonth ? 'bg-gray-100/50 border-gray-200' : 'bg-white/60 border-white/40'}

  if (loading) {                      ${today ? 'ring-2 ring-blue-500 shadow-lg' : ''}

    return (                      ${shift ? 'hover:shadow-xl cursor-pointer' : ''}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 flex items-center justify-center">                    `}

        <div className="text-center">                  >

          <div className="text-4xl mb-4">⏳</div>                    <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-gray-400' : today ? 'text-blue-600' : 'text-gray-900'}`}>

          <div className="text-xl font-semibold text-gray-700">Ładowanie kalendarza...</div>                      {format(day, 'd')}

        </div>                    </div>

      </div>                    

    )                    {shift && isCurrentMonth && (

  }                      <div className="space-y-1">

                        <Badge 

  if (error || !data) {                          variant={shift.status === 'confirmed' ? 'success' : shift.status === 'pending' ? 'warning' : 'danger'} 

    return (                          size="sm"

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8 flex items-center justify-center">                          className="w-full justify-center"

        <Card variant="glass" className="max-w-md">                        >

          <CardBody>                          {shift.role}

            <div className="text-center">                        </Badge>

              <div className="text-4xl mb-4">❌</div>                        <div className="text-xs text-gray-600 font-mono">

              <div className="text-xl font-semibold text-red-600 mb-2">Błąd ładowania</div>                          {shift.start}-{shift.end}

              <div className="text-gray-600">{error || 'Nie udało się załadować kalendarza'}</div>                        </div>

            </div>                      </div>

          </CardBody>                    )}

        </Card>                  </div>

      </div>                )

    )              })}

  }            </div>

          </CardBody>

  const { shifts, stats } = data        </Card>



  return (        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">          <Card variant="gradient">

      <div className="mx-auto max-w-7xl space-y-6">            <CardBody className="text-center">

        <div className="flex items-center justify-between">              <div className="text-4xl mb-2">✅</div>

          <div>              <div className="text-3xl font-bold text-gray-900 mb-1">

            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">                {shifts.filter(s => s.status === 'confirmed').length}

              Kalendarz 📅              </div>

            </h1>              <div className="text-sm text-gray-600">Potwierdzone zmiany</div>

            <p className="text-gray-600">Twoje zaplanowane zmiany</p>            </CardBody>

          </div>          </Card>

          <div className="flex items-center gap-3">

            <Button variant="ghost" onClick={previousMonth}>◀</Button>          <Card variant="gradient">

            <div className="text-xl font-bold">{format(currentMonth, 'LLLL yyyy', { locale: pl })}</div>            <CardBody className="text-center">

            <Button variant="ghost" onClick={nextMonth}>▶</Button>              <div className="text-4xl mb-2">⏳</div>

          </div>              <div className="text-3xl font-bold text-gray-900 mb-1">

        </div>                {shifts.filter(s => s.status === 'pending').length}

              </div>

        <Card variant="glass">              <div className="text-sm text-gray-600">Oczekujące</div>

          <CardBody>            </CardBody>

            <div className="grid grid-cols-7 gap-2 mb-4">          </Card>

              {weekDays.map(day => (

                <div key={day} className="text-center font-semibold text-gray-600 text-sm p-2">          <Card variant="gradient">

                  {day}            <CardBody className="text-center">

                </div>              <div className="text-4xl mb-2">⏱️</div>

              ))}              <div className="text-3xl font-bold text-gray-900 mb-1">

            </div>                {shifts.length * 8}h

                          </div>

            <div className="grid grid-cols-7 gap-2">              <div className="text-sm text-gray-600">Zaplanowane godziny</div>

              {days.map(day => {            </CardBody>

                const shift = getShiftForDay(day)          </Card>

                const isCurrentMonth = isSameMonth(day, currentMonth)        </div>

                const today = isToday(day)

                        <Card variant="glass">

                return (          <CardHeader>

                  <div            <h2 className="text-2xl font-bold">📋 Nadchodzące zmiany</h2>

                    key={day.toString()}          </CardHeader>

                    className={`          <CardBody>

                      min-h-[100px] p-2 rounded-lg border transition-all            <div className="space-y-3">

                      ${!isCurrentMonth ? 'bg-gray-100/50 border-gray-200' : 'bg-white/60 border-white/40'}              {shifts.slice(0, 5).map((shift, idx) => (

                      ${today ? 'ring-2 ring-blue-500 shadow-lg' : ''}                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/60 p-4">

                      ${shift ? 'hover:shadow-xl cursor-pointer' : ''}                  <div className="flex items-center gap-4">

                    `}                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">

                  >                      {format(new Date(shift.date), 'd')}

                    <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-gray-400' : today ? 'text-blue-600' : 'text-gray-900'}`}>                    </div>

                      {format(day, 'd')}                    <div>

                    </div>                      <div className="font-bold text-gray-900">{format(new Date(shift.date), 'EEEE, d MMMM', { locale: pl })}</div>

                                          <div className="text-sm text-gray-600">{shift.start} - {shift.end} • {shift.role}</div>

                    {shift && isCurrentMonth && (                    </div>

                      <div className="space-y-1">                  </div>

                        <Badge                   <Badge variant={shift.status === 'confirmed' ? 'success' : shift.status === 'pending' ? 'warning' : 'danger'}>

                          variant={                    {shift.status === 'confirmed' ? '✅ Potwierdzona' : shift.status === 'pending' ? '⏳ Oczekuje' : '❌ Anulowana'}

                            shift.status === 'completed' || shift.status === 'assigned'                   </Badge>

                              ? 'success'                 </div>

                              : shift.status === 'declined'               ))}

                                ? 'danger'             </div>

                                : 'warning'          </CardBody>

                          }        </Card>

                          size="sm"      </div>

                          className="w-full justify-center"    </div>

                        >  )

                          {shift.role}}

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

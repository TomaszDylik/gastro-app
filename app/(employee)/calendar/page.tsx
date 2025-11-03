'use client'export default function CalendarPage() {

  return (

import { useState } from 'react'    <main className="container mx-auto p-4">

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'      <h1 className="mb-2 text-xl font-semibold">Calendar</h1>

import { pl } from 'date-fns/locale'      <p className="text-gray-600">Widok pracownika — placeholder.</p>

import { Card, CardBody, CardHeader } from '@/components/ui/Card'    </main>

import { Badge } from '@/components/ui/Badge'  )

import { Button } from '@/components/ui/Button'}


interface Shift {
  date: string
  start: string
  end: string
  role: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const shifts: Shift[] = [
    { date: '2025-11-03', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'confirmed' },
    { date: '2025-11-04', start: '10:00', end: '18:00', role: 'Kelnerka', status: 'confirmed' },
    { date: '2025-11-05', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'pending' },
    { date: '2025-11-07', start: '12:00', end: '20:00', role: 'Barista', status: 'confirmed' },
    { date: '2025-11-10', start: '09:00', end: '17:00', role: 'Kelnerka', status: 'confirmed' },
  ]

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie']

  const getShiftForDay = (date: Date) => {
    return shifts.find(s => s.date === format(date, 'yyyy-MM-dd'))
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
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

        <Card variant="glass">
          <CardBody>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm p-2">
                  {day}
                </div>
              ))}
            </div>
            
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
                          variant={shift.status === 'confirmed' ? 'success' : shift.status === 'pending' ? 'warning' : 'danger'} 
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.filter(s => s.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Potwierdzone zmiany</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Oczekujące</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.length * 8}h
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
            <div className="space-y-3">
              {shifts.slice(0, 5).map((shift, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      {format(new Date(shift.date), 'd')}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{format(new Date(shift.date), 'EEEE, d MMMM', { locale: pl })}</div>
                      <div className="text-sm text-gray-600">{shift.start} - {shift.end} • {shift.role}</div>
                    </div>
                  </div>
                  <Badge variant={shift.status === 'confirmed' ? 'success' : shift.status === 'pending' ? 'warning' : 'danger'}>
                    {shift.status === 'confirmed' ? '✅ Potwierdzona' : shift.status === 'pending' ? '⏳ Oczekuje' : '❌ Anulowana'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Shift {
  id: number
  employeeId: number
  employeeName: string
  day: number
  startHour: number
  endHour: number
  role: string
  status: 'draft' | 'published' | 'confirmed'
}

export default function SchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([
    { id: 1, employeeId: 1, employeeName: 'Anna Kowalska', day: 1, startHour: 9, endHour: 17, role: 'Kelnerka', status: 'published' },
    { id: 2, employeeId: 1, employeeName: 'Anna Kowalska', day: 3, startHour: 10, endHour: 18, role: 'Kelnerka', status: 'confirmed' },
    { id: 3, employeeId: 2, employeeName: 'Jan Nowak', day: 1, startHour: 8, endHour: 16, role: 'Kucharz', status: 'published' },
    { id: 4, employeeId: 2, employeeName: 'Jan Nowak', day: 2, startHour: 8, endHour: 16, role: 'Kucharz', status: 'published' },
    { id: 5, employeeId: 3, employeeName: 'Maria Wiśniewska', day: 4, startHour: 12, endHour: 20, role: 'Barista', status: 'draft' },
  ])

  const employees = [
    { id: 1, name: 'Anna Kowalska', avatar: '👩‍🦰' },
    { id: 2, name: 'Jan Nowak', avatar: '👨‍🍳' },
    { id: 3, name: 'Maria Wiśniewska', avatar: '👩‍💼' },
    { id: 4, name: 'Piotr Kowalski', avatar: '👨' },
    { id: 5, name: 'Ewa Nowak', avatar: '👱‍♀️' },
  ]

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const previousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7))
  }

  const nextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7))
  }

  const getShiftsForEmployeeAndDay = (employeeId: number, dayIndex: number) => {
    return shifts.filter(s => s.employeeId === employeeId && s.day === dayIndex)
  }

  const addShift = (employeeId: number, dayIndex: number) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    const newShift: Shift = {
      id: Math.max(...shifts.map(s => s.id), 0) + 1,
      employeeId,
      employeeName: employee.name,
      day: dayIndex,
      startHour: 9,
      endHour: 17,
      role: 'Kelnerka',
      status: 'draft'
    }
    setShifts([...shifts, newShift])
  }

  const removeShift = (shiftId: number) => {
    setShifts(shifts.filter(s => s.id !== shiftId))
  }

  const publishSchedule = () => {
    setShifts(shifts.map(s => ({ ...s, status: 'published' })))
    alert('Grafik opublikowany! Pracownicy otrzymali powiadomienia.')
  }

  const totalHours = shifts.reduce((sum, shift) => sum + (shift.endHour - shift.startHour), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
              Grafiki 📅
            </h1>
            <p className="text-gray-600">Zarządzaj harmonogramem pracy zespołu</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={previousWeek}>◀ Poprzedni</Button>
            <Button variant="ghost" onClick={nextWeek}>Następny ▶</Button>
            <Button variant="primary" onClick={publishSchedule}>
              📢 Opublikuj grafik
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.length}
              </div>
              <div className="text-sm text-gray-600">Zmian w grafiku</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {totalHours}h
              </div>
              <div className="text-sm text-gray-600">Łączne godziny</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {shifts.filter(s => s.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Potwierdzone</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">📝</div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {shifts.filter(s => s.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Szkice</div>
            </CardBody>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {format(weekStart, 'd MMMM', { locale: pl })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: pl })}
              </h2>
              <Button variant="ghost" size="sm">
                📋 Kopiuj tydzień
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="p-4 text-left font-bold text-gray-900 w-48">Pracownik</th>
                    {weekDays.map((day, idx) => (
                      <th key={idx} className="p-4 text-center min-w-[140px]">
                        <div className="font-bold text-gray-900">{format(day, 'EEE', { locale: pl })}</div>
                        <div className="text-sm text-gray-500">{format(day, 'd MMM', { locale: pl })}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-white/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-xl">
                            {employee.avatar}
                          </div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </td>
                      {weekDays.map((_, dayIndex) => {
                        const dayShifts = getShiftsForEmployeeAndDay(employee.id, dayIndex)
                        return (
                          <td key={dayIndex} className="p-2 text-center align-top">
                            <div className="space-y-2">
                              {dayShifts.map(shift => (
                                <div
                                  key={shift.id}
                                  className="relative rounded-lg p-2 text-sm shadow-md cursor-move bg-gradient-to-br from-purple-500 to-indigo-500 text-white hover:shadow-lg transition-all"
                                >
                                  <div className="font-bold">{shift.startHour}:00 - {shift.endHour}:00</div>
                                  <div className="text-xs">{shift.role}</div>
                                  <Badge 
                                    variant={shift.status === 'confirmed' ? 'success' : shift.status === 'published' ? 'warning' : 'default'}
                                    size="sm"
                                    className="mt-1"
                                  >
                                    {shift.status === 'confirmed' ? '✅' : shift.status === 'published' ? '📢' : '📝'}
                                  </Badge>
                                  <button
                                    onClick={() => removeShift(shift.id)}
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addShift(employee.id, dayIndex)}
                                className="w-full rounded-lg border-2 border-dashed border-gray-300 p-2 text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-all"
                              >
                                + Dodaj
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">💡 Podpowiedzi</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                <div className="text-2xl">🖱️</div>
                <div>
                  <div className="font-bold text-gray-900">Przeciągnij i upuść</div>
                  <div className="text-sm text-gray-600">
                    Kliknij i przeciągnij zmiany, aby przenieść je do innego dnia lub pracownika
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-bold text-gray-900">Konflikty</div>
                  <div className="text-sm text-gray-600">
                    System automatycznie wykryje nakładające się zmiany i urlopy
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-yellow-50 p-4">
                <div className="text-2xl">📋</div>
                <div>
                  <div className="font-bold text-gray-900">Kopiowanie</div>
                  <div className="text-sm text-gray-600">
                    Użyj przycisku "Kopiuj tydzień", aby powielić grafik na następny tydzień
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4">
                <div className="text-2xl">📢</div>
                <div>
                  <div className="font-bold text-gray-900">Publikacja</div>
                  <div className="text-sm text-gray-600">
                    Po opublikowaniu wszyscy pracownicy otrzymają powiadomienia o grafiku
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type TimeSlot = 'morning' | 'afternoon' | 'evening'
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface Availability {
  [key: string]: {
    [key in TimeSlot]: boolean
  }
}

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability>({
    mon: { morning: false, afternoon: false, evening: false },
    tue: { morning: false, afternoon: false, evening: false },
    wed: { morning: false, afternoon: false, evening: false },
    thu: { morning: false, afternoon: false, evening: false },
    fri: { morning: false, afternoon: false, evening: false },
    sat: { morning: false, afternoon: false, evening: false },
    sun: { morning: false, afternoon: false, evening: false },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [membershipId, setMembershipId] = useState<string | null>(null)

  // Load user and availability data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Get user info to find membershipId
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) throw new Error('Failed to fetch user info')
        
        const userData = await userRes.json()
        const activeMembership = userData.memberships?.find((m: any) => m.status === 'active')
        
        if (!activeMembership) {
          throw new Error('No active membership found')
        }

        setMembershipId(activeMembership.id)

        // Load availability
        const availRes = await fetch(`/api/availability?membershipId=${activeMembership.id}`)
        if (!availRes.ok) throw new Error('Failed to fetch availability')
        
        const availData = await availRes.json()
        setAvailability(availData.availability)

      } catch (err) {
        console.error('Error loading availability:', err)
        setError(err instanceof Error ? err.message : 'Failed to load availability')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const days = [
    { key: 'mon', label: 'Poniedziałek' },
    { key: 'tue', label: 'Wtorek' },
    { key: 'wed', label: 'Środa' },
    { key: 'thu', label: 'Czwartek' },
    { key: 'fri', label: 'Piątek' },
    { key: 'sat', label: 'Sobota' },
    { key: 'sun', label: 'Niedziela' },
  ]

  const timeSlots: { key: TimeSlot; label: string; time: string }[] = [
    { key: 'morning', label: 'Rano', time: '06:00-14:00' },
    { key: 'afternoon', label: 'Popołudnie', time: '14:00-22:00' },
    { key: 'evening', label: 'Wieczór', time: '18:00-02:00' },
  ]

  const toggleAvailability = (day: DayOfWeek, slot: TimeSlot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot]
      }
    }))
  }

  const setAllDay = (day: DayOfWeek, available: boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        morning: available,
        afternoon: available,
        evening: available
      }
    }))
  }

  const handleSave = async () => {
    if (!membershipId) {
      setError('No membership found')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId,
          availability,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save availability')
      }

      const data = await response.json()
      setSuccess(`Dostępność zapisana! Utworzono ${data.recordsCreated} rekordów.`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Error saving availability:', err)
      setError(err instanceof Error ? err.message : 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const getTotalAvailableSlots = () => {
    let count = 0
    Object.values(availability).forEach(day => {
      Object.values(day).forEach(slot => {
        if (slot) count++
      })
    })
    return count
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent">
              Dostępność 📋
            </h1>
            <p className="text-gray-600">Zadeklaruj swoją dostępność do pracy</p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? '💾 Zapisywanie...' : '💾 Zapisz dostępność'}
          </Button>
        </div>

        {error && (
          <Card variant="glass" className="border-2 border-red-300 bg-red-50/50">
            <CardBody>
              <div className="flex items-center gap-3 text-red-700">
                <span className="text-2xl">❌</span>
                <span className="font-semibold">{error}</span>
              </div>
            </CardBody>
          </Card>
        )}

        {success && (
          <Card variant="glass" className="border-2 border-green-300 bg-green-50/50">
            <CardBody>
              <div className="flex items-center gap-3 text-green-700">
                <span className="text-2xl">✅</span>
                <span className="font-semibold">{success}</span>
              </div>
            </CardBody>
          </Card>
        )}

        {loading ? (
          <Card variant="glass">
            <CardBody className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 text-6xl">⏳</div>
                <div className="text-xl font-semibold text-gray-700">Ładowanie dostępności...</div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {getTotalAvailableSlots()}
              </div>
              <div className="text-sm text-gray-600">Dostępnych slotów</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Object.values(availability).filter(day => day.morning || day.afternoon || day.evening).length}
              </div>
              <div className="text-sm text-gray-600">Dostępnych dni</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Math.round((getTotalAvailableSlots() / 21) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Dostępności</div>
            </CardBody>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🗓️ Tygodniowy harmonogram</h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="p-4 text-left font-bold text-gray-900">Dzień</th>
                    {timeSlots.map(slot => (
                      <th key={slot.key} className="p-4 text-center">
                        <div className="font-bold text-gray-900">{slot.label}</div>
                        <div className="text-xs text-gray-500 font-normal">{slot.time}</div>
                      </th>
                    ))}
                    <th className="p-4 text-center font-bold text-gray-900">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day.key} className="border-b border-gray-100 hover:bg-white/40">
                      <td className="p-4 font-medium text-gray-900">{day.label}</td>
                      {timeSlots.map(slot => (
                        <td key={slot.key} className="p-4 text-center">
                          <button
                            onClick={() => toggleAvailability(day.key as DayOfWeek, slot.key)}
                            className={`h-12 w-12 rounded-xl font-bold shadow-lg transition-all ${
                              availability[day.key][slot.key]
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:shadow-xl scale-105'
                                : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                            }`}
                          >
                            {availability[day.key][slot.key] ? '✓' : '✗'}
                          </button>
                        </td>
                      ))}
                      <td className="p-4 text-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAllDay(day.key as DayOfWeek, true)}
                        >
                          Wszystkie
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAllDay(day.key as DayOfWeek, false)}
                        >
                          Żadne
                        </Button>
                      </td>
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
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                <div className="text-2xl">ℹ️</div>
                <div>
                  <div className="font-bold text-gray-900">Aktualizuj regularnie</div>
                  <div className="text-sm text-gray-600">
                    Pamiętaj o aktualizacji swojej dostępności, gdy zmienią się Twoje plany
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-bold text-gray-900">Elastyczność</div>
                  <div className="text-sm text-gray-600">
                    Im bardziej elastyczna dostępność, tym łatwiej zostaniesz uwzględniony w grafiku
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-yellow-50 p-4">
                <div className="text-2xl">⏰</div>
                <div>
                  <div className="font-bold text-gray-900">Zmiana dostępności</div>
                  <div className="text-sm text-gray-600">
                    Zmiany dostępności najlepiej zgłaszać co najmniej 7 dni przed planowanym terminem
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}

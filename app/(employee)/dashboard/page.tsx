'use client'

import { useState, useEffect } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  restaurantName: string
  membershipId: string
}

interface Shift {
  id: string
  start: string
  end: string
  roleTag: string | null
  notes: string | null
}

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  scheduleId: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [todayShift, setTodayShift] = useState<Shift | null>(null)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    loadDashboardData()

    // Odświeżaj licznik co sekundę gdy pracownik jest w pracy
    const interval = setInterval(() => {
      if (activeEntry) {
        const minutes = differenceInMinutes(new Date(), new Date(activeEntry.clockIn))
        setElapsedTime(minutes)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  const loadDashboardData = async () => {
    try {
      // Pobierz dane zalogowanego użytkownika
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) {
        router.push('/login')
        return
      }

      const user = await userResponse.json()

      // Jeśli to manager, przekieruj na panel managera
      if (user.role === 'manager') {
        router.push('/manager/dashboard')
        return
      }

      setUserData(user)

      // Pobierz dzisiejszą zmianę (mock - w rzeczywistości pobierz z API/Supabase)
      // TODO: Zaimplementuj prawdziwe zapytanie gdy będzie membership

      // Mock dzisiejszej zmiany
      const today = new Date()
      const mockShift: Shift = {
        id: '1',
        start: new Date(today.setHours(9, 0, 0)).toISOString(),
        end: new Date(today.setHours(17, 0, 0)).toISOString(),
        roleTag: 'Kelner',
        notes: null,
      }
      setTodayShift(mockShift)

      // Sprawdź czy jest aktywny wpis czasu (czy pracownik jest w pracy)
      // TODO: Query do TimeEntry gdzie clockOut IS NULL
      const mockActiveEntry: TimeEntry | null = null // Zmień gdy będzie logika
      setActiveEntry(mockActiveEntry)
    } catch (error) {
      console.error('Błąd ładowania danych:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    try {
      const now = new Date().toISOString()

      // TODO: Zapisz do bazy TimeEntry
      const newEntry: TimeEntry = {
        id: Math.random().toString(),
        clockIn: now,
        clockOut: null,
        scheduleId: todayShift?.id || '',
      }

      setActiveEntry(newEntry)
      alert('✅ Rozpoczęto pracę!')
    } catch (error) {
      console.error('Błąd rozpoczęcia pracy:', error)
      alert('❌ Nie udało się rozpocząć pracy')
    }
  }

  const handleClockOut = async () => {
    if (!activeEntry) return

    try {
      const now = new Date().toISOString()
      const minutes = differenceInMinutes(new Date(now), new Date(activeEntry.clockIn))

      // TODO: Zaktualizuj TimeEntry w bazie (ustaw clockOut, status='pending')
      // Przykładowe dane do zapisu:
      const timeEntry = {
        id: activeEntry.id,
        clockIn: activeEntry.clockIn,
        clockOut: now,
        totalMinutes: minutes,
        status: 'pending', // Oczekuje na potwierdzenie managera
        approvedByUserId: null,
        approvedAt: null,
      }

      console.log('Zapisuję TimeEntry (pending):', timeEntry)

      setActiveEntry(null)
      setElapsedTime(0)
      alert(
        `✅ Zakończono pracę!\n⏱️ Czas: ${formatTime(minutes)}\n⏳ Oczekuje na potwierdzenie managera`
      )

      loadDashboardData() // Odśwież dane
    } catch (error) {
      console.error('Błąd zakończenia pracy:', error)
      alert('❌ Nie udało się zakończyć pracy')
    }
  }

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <main className="container mx-auto max-w-2xl p-4">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-48 rounded bg-gray-200"></div>
          <div className="mb-4 h-40 rounded bg-gray-200"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-2xl p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold">
          {userData?.name ? `Witaj, ${userData.name.split(' ')[0]}! 👋` : 'Dashboard'}
        </h1>
        <p className="text-gray-600">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}</p>
        {userData?.restaurantName && (
          <p className="mt-1 text-sm text-gray-500">📍 {userData.restaurantName}</p>
        )}
      </div>

      {/* Dzisiejsza zmiana */}
      {todayShift ? (
        <div className="mb-4 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">📅 Dzisiejsza zmiana</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {todayShift.roleTag || 'Zmiana'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-500">⏰ Start:</span>
              <span className="font-semibold">{format(new Date(todayShift.start), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">⏰ Koniec:</span>
              <span className="font-semibold">{format(new Date(todayShift.end), 'HH:mm')}</span>
            </div>
            {todayShift.notes && (
              <div className="border-t pt-2">
                <p className="text-sm text-gray-600">📝 {todayShift.notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-gray-500">Brak zaplanowanej zmiany na dziś</p>
        </div>
      )}

      {/* Panel Start/Stop */}
      <div
        className={`mb-4 rounded-lg p-6 text-white shadow-lg transition-all duration-500 ${
          activeEntry
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50'
            : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/50'
        }`}
      >
        {activeEntry ? (
          <>
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-300"></div>
                <span className="text-sm font-medium">W PRACY</span>
              </div>
              <div className="mb-2 text-5xl font-bold">{formatTime(elapsedTime)}</div>
              <p className="text-sm text-red-100">
                Rozpoczęto o {format(new Date(activeEntry.clockIn), 'HH:mm')}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClockOut}
                className="relative flex h-48 w-48 flex-col items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-red-600 shadow-2xl transition-all hover:scale-105 hover:bg-red-50"
              >
                <div className="absolute inset-0 rounded-full bg-red-600 opacity-0 transition-opacity hover:opacity-10"></div>
                <span className="mb-2 text-4xl">🛑</span>
                <span>Zakończ pracę</span>
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-red-100">
              ⚠️ Po zakończeniu poczekaj na potwierdzenie managera
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h3 className="mb-2 text-xl font-semibold">Gotowy do pracy?</h3>
              <p className="text-sm text-green-100">Rozpocznij rejestrowanie czasu</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClockIn}
                disabled={!todayShift}
                className="relative flex h-48 w-48 flex-col items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-green-600 shadow-2xl transition-all hover:scale-105 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-full bg-green-600 opacity-0 transition-opacity hover:opacity-10"></div>
                <span className="mb-2 text-4xl">▶️</span>
                <span>Rozpocznij pracę</span>
              </button>
            </div>

            {!todayShift && (
              <p className="mt-2 text-center text-xs text-blue-100">
                Brak dzisiejszej zmiany w grafiku
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

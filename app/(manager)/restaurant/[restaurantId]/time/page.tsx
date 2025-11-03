'use client'

import { useState, useEffect } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { pl } from 'date-fns/locale'

interface TimeEntry {
  id: string
  employeeName: string
  employeeId: string
  clockIn: string
  clockOut: string | null
  totalMinutes: number | null
  status: 'active' | 'pending' | 'approved' | 'rejected'
  date: string
  roleTag?: string
}

export default function TimeManagementPage() {
  const [activeEntries, setActiveEntries] = useState<TimeEntry[]>([])
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([])
  const [approvedEntries, setApprovedEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadTimeEntries()

    // Aktualizuj czas co sekundę dla live timera
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const loadTimeEntries = async () => {
    try {
      // TODO: Pobierz wpisy z API
      // Mock data
      const mockActive: TimeEntry[] = [
        {
          id: '1',
          employeeName: 'Jan Kowalski',
          employeeId: 'emp1',
          clockIn: new Date(Date.now() - 3600000 * 2).toISOString(), // 2h temu
          clockOut: null,
          totalMinutes: null,
          status: 'active',
          date: format(new Date(), 'yyyy-MM-dd'),
          roleTag: 'Kelner',
        },
        {
          id: '2',
          employeeName: 'Anna Nowak',
          employeeId: 'emp2',
          clockIn: new Date(Date.now() - 3600000 * 1.5).toISOString(), // 1.5h temu
          clockOut: null,
          totalMinutes: null,
          status: 'active',
          date: format(new Date(), 'yyyy-MM-dd'),
          roleTag: 'Kuchnia',
        },
      ]

      const mockPending: TimeEntry[] = [
        {
          id: '3',
          employeeName: 'Piotr Wiśniewski',
          employeeId: 'emp3',
          clockIn: new Date(Date.now() - 3600000 * 8).toISOString(),
          clockOut: new Date(Date.now() - 3600000 * 0.5).toISOString(),
          totalMinutes: 450, // 7.5h
          status: 'pending',
          date: format(new Date(), 'yyyy-MM-dd'),
          roleTag: 'Bar',
        },
      ]

      setActiveEntries(mockActive)
      setPendingEntries(mockPending)
      setApprovedEntries([])
    } catch (error) {
      console.error('Błąd ładowania wpisów:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (entryId: string) => {
    try {
      // TODO: Zapisz do bazy z approvedByUserId i approvedAt
      const entry = pendingEntries.find((e) => e.id === entryId)
      if (!entry) return

      console.log('Zatwierdzam wpis:', entryId)

      // Przenieś do zatwierdzonych
      setPendingEntries((prev) => prev.filter((e) => e.id !== entryId))
      setApprovedEntries((prev) => [...prev, { ...entry, status: 'approved' }])

      alert(
        `✅ Zatwierdzono ${entry.totalMinutes ? formatTime(entry.totalMinutes) : ''} dla ${entry.employeeName}`
      )
    } catch (error) {
      console.error('Błąd zatwierdzania:', error)
      alert('❌ Nie udało się zatwierdzić wpisu')
    }
  }

  const handleReject = async (entryId: string, reason: string) => {
    try {
      // TODO: Zapisz odrzucenie z powodem
      const entry = pendingEntries.find((e) => e.id === entryId)
      if (!entry) return

      console.log('Odrzucam wpis:', entryId, 'Powód:', reason)

      setPendingEntries((prev) => prev.filter((e) => e.id !== entryId))
      alert(`❌ Odrzucono wpis dla ${entry.employeeName}`)
      loadTimeEntries() // Odśwież
    } catch (error) {
      console.error('Błąd odrzucania:', error)
      alert('❌ Nie udało się odrzucić wpisu')
    }
  }

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}min`
  }

  const calculateLiveTime = (clockIn: string) => {
    const minutes = differenceInMinutes(currentTime, new Date(clockIn))
    return formatTime(minutes)
  }

  if (loading) {
    return (
      <main className="container mx-auto max-w-6xl p-4">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-64 rounded bg-gray-200"></div>
          <div className="h-40 rounded bg-gray-200"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-2xl font-bold">⏱️ Zarządzanie czasem pracy</h1>

      {/* Aktywni pracownicy (w pracy teraz) */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
          Pracownicy w pracy ({activeEntries.length})
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{entry.employeeName}</h3>
                  {entry.roleTag && (
                    <span className="rounded-full bg-red-200 px-2 py-1 text-xs text-red-800">
                      {entry.roleTag}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    {calculateLiveTime(entry.clockIn)}
                  </div>
                  <div className="text-xs text-gray-600">
                    od {format(new Date(entry.clockIn), 'HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                <span>Aktywnie pracuje</span>
              </div>
            </div>
          ))}

          {activeEntries.length === 0 && (
            <p className="col-span-full py-8 text-center text-gray-500">Brak pracowników w pracy</p>
          )}
        </div>
      </section>

      {/* Oczekujące na zatwierdzenie */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          Do zatwierdzenia ({pendingEntries.length})
        </h2>

        <div className="space-y-3">
          {pendingEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold">{entry.employeeName}</h3>
                    {entry.roleTag && (
                      <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs text-yellow-800">
                        {entry.roleTag}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>{format(new Date(entry.clockIn), 'HH:mm', { locale: pl })}</span>
                    <span className="mx-2">→</span>
                    <span>
                      {entry.clockOut
                        ? format(new Date(entry.clockOut), 'HH:mm', { locale: pl })
                        : '...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">
                      {entry.totalMinutes ? formatTime(entry.totalMinutes) : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(entry.date), 'd MMM', { locale: pl })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(entry.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                    >
                      ✅ Zatwierdź
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Powód odrzucenia (opcjonalnie):')
                        if (reason !== null) handleReject(entry.id, reason)
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                    >
                      ❌ Odrzuć
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pendingEntries.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              Brak wpisów oczekujących na zatwierdzenie
            </p>
          )}
        </div>
      </section>

      {/* Zatwierdzone dzisiaj */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          Zatwierdzone dzisiaj ({approvedEntries.length})
        </h2>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {approvedEntries.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Pracownik
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rola</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Godziny
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Czas pracy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {approvedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{entry.employeeName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        {entry.roleTag || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(entry.clockIn), 'HH:mm')} -{' '}
                      {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : '...'}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      {entry.totalMinutes ? formatTime(entry.totalMinutes) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-gray-500">Brak zatwierdzonych wpisów dzisiaj</p>
          )}
        </div>
      </section>
    </main>
  )
}

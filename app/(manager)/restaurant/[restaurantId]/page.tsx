'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ActiveShift {
  id: string
  employeeName: string
  employeeId: string
  clockIn: string
  clockOut: string | null
  scheduleCategory: string
  elapsedMinutes: number
}

interface DashboardStats {
  activeShiftsCount: number
  scheduledTodayCount: number
  pendingReportsCount: number
  teamMembersCount: number
}

export default function ManagerDashboardPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([])
  const [restaurantName, setRestaurantName] = useState('')

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [restaurantId])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      // TODO: Implement GET /api/manager/dashboard?restaurantId=xxx
      const response = await fetch(`/api/manager/dashboard?restaurantId=${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActiveShifts(data.activeShifts)
        setRestaurantName(data.restaurantName)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEndShift = async (timeEntryId: string) => {
    if (!confirm('Czy na pewno chcesz zakończyć tę zmianę?')) return

    try {
      // TODO: Implement POST /api/manager/time/end
      const response = await fetch('/api/manager/time/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeEntryId }),
      })

      if (response.ok) {
        alert('Zmiana zakończona pomyślnie')
        loadDashboard()
      } else {
        alert('Błąd podczas kończenia zmiany')
      }
    } catch (error) {
      console.error('Error ending shift:', error)
      alert('Błąd połączenia')
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-lg">Ładowanie dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Dashboard - {restaurantName || 'Restauracja'} 👨‍💼
        </h2>
        <p className="text-gray-600 mt-2">
          Zarządzaj zespołem, grafikami i raportami
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="⏰"
          title="Aktywne zmiany"
          value={stats?.activeShiftsCount || 0}
          color="green"
        />
        <StatCard
          icon="📅"
          title="Zaplanowane dziś"
          value={stats?.scheduledTodayCount || 0}
          color="blue"
        />
        <StatCard
          icon="📋"
          title="Raporty do podpisu"
          value={stats?.pendingReportsCount || 0}
          color="orange"
        />
        <StatCard
          icon="👥"
          title="Członków zespołu"
          value={stats?.teamMembersCount || 0}
          color="purple"
        />
      </div>

      {/* Active Shifts - "Dzisiejsi na zmianie" */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          ⏰ Dzisiejsi na zmianie ({activeShifts.length})
        </h3>

        {activeShifts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Brak aktywnych zmian w tej chwili
          </p>
        ) : (
          <div className="space-y-3">
            {activeShifts.map((shift) => (
              <ActiveShiftCard
                key={shift.id}
                shift={shift}
                onEndShift={handleEndShift}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Szybkie akcje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionButton
            icon="👥"
            label="Zaproś pracownika"
            href={`/restaurant/${restaurantId}/team/invite`}
          />
          <QuickActionButton
            icon="📅"
            label="Dodaj grafik"
            href={`/restaurant/${restaurantId}/schedules/new`}
          />
          <QuickActionButton
            icon="📋"
            label="Wygeneruj raport dzienny"
            href={`/restaurant/${restaurantId}/reports/daily`}
          />
          <QuickActionButton
            icon="⚙️"
            label="Kategorie zmian"
            href={`/restaurant/${restaurantId}/settings`}
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string
  title: string
  value: number
  color: string
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }

  return (
    <div
      className={`border-2 rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl opacity-50">{icon}</span>
      </div>
    </div>
  )
}

// Active Shift Card
function ActiveShiftCard({
  shift,
  onEndShift,
}: {
  shift: ActiveShift
  onEndShift: (id: string) => void
}) {
  const hours = Math.floor(shift.elapsedMinutes / 60)
  const minutes = shift.elapsedMinutes % 60

  return (
    <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-800">
            {shift.employeeName}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            {shift.scheduleCategory}
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span>Rozpoczęto: {new Date(shift.clockIn).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          })}</span>
          <span className="mx-2">•</span>
          <span className="font-medium text-green-600">
            {hours}h {minutes}min
          </span>
        </div>
      </div>

      <button
        onClick={() => onEndShift(shift.id)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
      >
        ⏹️ Zakończ
      </button>
    </div>
  )
}

// Quick Action Button
function QuickActionButton({
  icon,
  label,
  href,
}: {
  icon: string
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  )
}

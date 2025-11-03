'use client'

import { useState, useEffect } from 'react'

interface AdminStats {
  totalUsers: number
  totalCompanies: number
  totalRestaurants: number
  totalEmployees: number
  activeShiftsToday: number
  reportsGeneratedToday: number
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      // TODO: Implement GET /api/admin/dashboard
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-red-600">Ładowanie dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard 🛡️</h2>
        <p className="mt-2 text-gray-600">Przegląd całego systemu Gastro Schedules (read-only)</p>
      </div>

      {/* Warning Banner */}
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-800">Tryb wsparcia technicznego</p>
            <p className="text-sm text-red-600">
              Ten panel służy wyłącznie do monitorowania i wsparcia. Nie dokonuj żadnych zmian bez
              zgody użytkowników.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon="👥"
          title="Wszyscy użytkownicy"
          value={stats?.totalUsers || 0}
          color="red"
        />
        <StatCard
          icon="🏭"
          title="Firmy w systemie"
          value={stats?.totalCompanies || 0}
          color="purple"
        />
        <StatCard icon="🍽️" title="Restauracje" value={stats?.totalRestaurants || 0} color="blue" />
        <StatCard icon="👨‍🍳" title="Pracownicy" value={stats?.totalEmployees || 0} color="green" />
        <StatCard
          icon="⏰"
          title="Aktywne zmiany dziś"
          value={stats?.activeShiftsToday || 0}
          color="orange"
        />
        <StatCard
          icon="📊"
          title="Raporty wygenerowane dziś"
          value={stats?.reportsGeneratedToday || 0}
          color="yellow"
        />
      </div>

      {/* Quick Tools */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">Narzędzia wsparcia</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ToolButton
            icon="👥"
            label="Przegląd użytkowników"
            href="/admin/users"
            description="Lista wszystkich użytkowników systemu"
          />
          <ToolButton
            icon="🍽️"
            label="Przegląd restauracji"
            href="/admin/restaurants"
            description="Wszystkie restauracje w systemie"
          />
          <ToolButton
            icon="📜"
            label="Audit Log"
            href="/admin/audit"
            description="Historia wszystkich działań w systemie"
          />
          <ToolButton
            icon="📊"
            label="Statystyki systemowe"
            href="/admin/stats"
            description="Zaawansowane metryki i analityka"
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
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <span className="text-5xl opacity-50">{icon}</span>
      </div>
    </div>
  )
}

// Tool Button
function ToolButton({
  icon,
  label,
  href,
  description,
}: {
  icon: string
  label: string
  href: string
  description: string
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-red-300 hover:bg-red-50"
    >
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </a>
  )
}

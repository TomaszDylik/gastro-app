'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  totalCompanies: number
  totalRestaurants: number
  totalManagers: number
  totalEmployees: number
  activeShiftsToday: number
  pendingReports: number
}

export default function OwnerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      // TODO: Implement GET /api/owner/dashboard
      const response = await fetch('/api/owner/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setUserName(data.userName)
      }
    } catch (error) {
      console.error('Error loading owner dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-purple-600">Ładowanie dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Witaj, {userName || 'Właścicielu'}! 👋</h2>
        <p className="mt-2 text-gray-600">Przegląd wszystkich firm i restauracji w systemie</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard icon="🏭" title="Firmy" value={stats?.totalCompanies || 0} color="purple" />
        <StatCard icon="🍽️" title="Restauracje" value={stats?.totalRestaurants || 0} color="blue" />
        <StatCard icon="👔" title="Managerowie" value={stats?.totalManagers || 0} color="green" />
        <StatCard icon="👥" title="Pracownicy" value={stats?.totalEmployees || 0} color="orange" />
        <StatCard
          icon="⏰"
          title="Aktywne zmiany dziś"
          value={stats?.activeShiftsToday || 0}
          color="red"
        />
        <StatCard
          icon="📋"
          title="Raporty do weryfikacji"
          value={stats?.pendingReports || 0}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">Szybkie akcje</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <QuickActionButton icon="🏭" label="Dodaj nową firmę" href="/owner/companies/new" />
          <QuickActionButton icon="👔" label="Zaproś managera" href="/owner/managers/invite" />
          <QuickActionButton icon="📊" label="Raporty tygodniowe" href="/owner/reports/weekly" />
          <QuickActionButton icon="📈" label="Raporty miesięczne" href="/owner/reports/monthly" />
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
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
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

// Quick Action Button
function QuickActionButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50"
    >
      <span className="text-3xl">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  )
}

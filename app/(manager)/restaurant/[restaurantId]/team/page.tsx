'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  hourlyRate: string
  stats: {
    totalHours: number
    shiftsAssigned: number
    shiftsCompleted: number
    shiftsDeclined: number
    upcomingShifts: number
    totalShifts: number
    timeEntriesCount: number
  }
  joinedAt: string
}

interface AggregateStats {
  totalMembers: number
  activeMembers: number
  pendingMembers: number
  totalHoursThisMonth: number
  totalShiftsThisMonth: number
}

export default function TeamPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('')

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/team?restaurantId=${restaurantId}`)
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load team')
        }

        const data = await response.json()
        setTeamMembers(data.teamMembers)
        setStats(data.stats)
        setMonth(data.month)

      } catch (err) {
        console.error('Error loading team:', err)
        setError(err instanceof Error ? err.message : 'Failed to load team')
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      loadTeam()
    }
  }, [restaurantId])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      pending: 'warning',
      inactive: 'danger',
    }
    return variants[status] || 'warning'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Card variant="glass">
            <CardBody className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 text-6xl">⏳</div>
                <div className="text-xl font-semibold text-gray-700">Ładowanie zespołu...</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Card variant="glass" className="border-2 border-red-300 bg-red-50/50">
            <CardBody>
              <div className="flex items-center gap-3 text-red-700">
                <span className="text-2xl">❌</span>
                <span className="font-semibold">{error}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-4xl font-bold text-transparent">
            Zespół 👥
          </h1>
          <p className="text-gray-600">Zarządzaj swoim zespołem - {month}</p>
        </div>

        {/* Aggregate Stats */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <Card variant="gradient">
              <CardBody className="text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalMembers}
                </div>
                <div className="text-sm text-gray-600">Członków zespołu</div>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardBody className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.activeMembers}
                </div>
                <div className="text-sm text-gray-600">Aktywnych</div>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardBody className="text-center">
                <div className="text-4xl mb-2">⏰</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.pendingMembers}
                </div>
                <div className="text-sm text-gray-600">Oczekujących</div>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardBody className="text-center">
                <div className="text-4xl mb-2">🕒</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.round(stats.totalHoursThisMonth)}h
                </div>
                <div className="text-sm text-gray-600">Godzin w tym miesiącu</div>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardBody className="text-center">
                <div className="text-4xl mb-2">📅</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalShiftsThisMonth}
                </div>
                <div className="text-sm text-gray-600">Zmian w tym miesiącu</div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Team Members Table */}
        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">📋 Członkowie zespołu</h2>
          </CardHeader>
          <CardBody>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak członków zespołu
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-left font-bold text-gray-900">Imię i nazwisko</th>
                      <th className="p-4 text-left font-bold text-gray-900">Kontakt</th>
                      <th className="p-4 text-center font-bold text-gray-900">Rola</th>
                      <th className="p-4 text-center font-bold text-gray-900">Status</th>
                      <th className="p-4 text-center font-bold text-gray-900">Stawka</th>
                      <th className="p-4 text-center font-bold text-gray-900">Godziny</th>
                      <th className="p-4 text-center font-bold text-gray-900">Zmiany</th>
                      <th className="p-4 text-center font-bold text-gray-900">Nadchodzące</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-white/40">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{member.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">{member.email}</div>
                          {member.phone && (
                            <div className="text-sm text-gray-500">{member.phone}</div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="info">{member.role}</Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={getStatusBadge(member.status)}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-medium text-gray-900">
                          {parseFloat(member.hourlyRate).toFixed(2)} PLN/h
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-bold text-gray-900">
                            {member.stats.totalHours}h
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.stats.timeEntriesCount} wpisów
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-bold text-gray-900">
                            {member.stats.totalShifts}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">{member.stats.shiftsCompleted} ✓</span>
                            {member.stats.shiftsDeclined > 0 && (
                              <> | <span className="text-red-600">{member.stats.shiftsDeclined} ✗</span></>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="font-bold text-orange-600">
                            {member.stats.upcomingShifts}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

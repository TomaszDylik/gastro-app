'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react'

interface Schedule {
  id: string
  name: string
  isActive: boolean
  restaurantId: string
  createdAt: string
  updatedAt: string
  stats: {
    totalShifts: number
    assignedShifts: number
    completedShifts: number
    totalAvailabilities: number
    totalTimeEntries: number
  }
}

interface SchedulesData {
  schedules: Schedule[]
  total: number
}

export default function SchedulesPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedulesData, setSchedulesData] = useState<SchedulesData | null>(null)
  const [creatingSchedule, setCreatingSchedule] = useState(false)
  const [newScheduleName, setNewScheduleName] = useState('')

  useEffect(() => {
    loadSchedules()
  }, [restaurantId])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/schedules?restaurantId=${restaurantId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load schedules')
      }

      const data = await response.json()
      setSchedulesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) {
      setError('Schedule name is required')
      return
    }

    try {
      setCreatingSchedule(true)
      setError(null)

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          name: newScheduleName,
          isActive: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create schedule')
      }

      setNewScheduleName('')
      await loadSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreatingSchedule(false)
    }
  }

  const handleToggleActive = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update schedule')
      }

      await loadSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This will also delete all associated shifts and assignments.')) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete schedule')
      }

      await loadSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading schedules...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Kalendarze
        </h1>
        <p className="text-gray-600">Zarządzaj harmonogramami pracy restauracji</p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody>
            <p className="text-red-600">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Create New Schedule */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Utwórz nowy harmonogram
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3">
            <input
              type="text"
              value={newScheduleName}
              onChange={(e) => setNewScheduleName(e.target.value)}
              placeholder="Nazwa harmonogramu (np. Luty 2025)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={creatingSchedule}
            />
            <Button
              onClick={handleCreateSchedule}
              disabled={creatingSchedule || !newScheduleName.trim()}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6"
            >
              {creatingSchedule ? 'Tworzę...' : 'Utwórz'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedulesData && schedulesData.schedules.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg mb-2">Brak harmonogramów</p>
                <p className="text-gray-500 text-sm">Utwórz pierwszy harmonogram, aby rozpocząć planowanie zmian</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          schedulesData?.schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  {/* Schedule Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">{schedule.name}</h3>
                      <Badge variant={schedule.isActive ? 'success' : 'default'}>
                        {schedule.isActive ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-orange-600">
                          {schedule.stats.totalShifts}
                        </div>
                        <div className="text-xs text-gray-600">Total Shifts</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {schedule.stats.assignedShifts}
                        </div>
                        <div className="text-xs text-gray-600">Assigned</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {schedule.stats.completedShifts}
                        </div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-purple-600">
                          {schedule.stats.totalAvailabilities}
                        </div>
                        <div className="text-xs text-gray-600">Availabilities</div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-indigo-600">
                          {schedule.stats.totalTimeEntries}
                        </div>
                        <div className="text-xs text-gray-600">Time Entries</div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Created: {new Date(schedule.createdAt).toLocaleDateString('pl-PL')}</span>
                      <span>Updated: {new Date(schedule.updatedAt).toLocaleDateString('pl-PL')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                      variant="secondary"
                      size="sm"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      {schedule.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </main>
  )
}

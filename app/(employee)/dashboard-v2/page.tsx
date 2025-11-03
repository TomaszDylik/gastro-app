/**
 * Futurystyczny Employee Dashboard
 * Features:
 * - Giant animated clock
 * - Real-time work tracking
 * - Today's shift timeline
 * - Quick actions with glassmorphism
 * - Stats cards with neon effects
 */

'use client'

import { useState, useEffect } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { pl } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { colors } from '@/lib/design-system'

interface WorkSession {
  isWorking: boolean
  clockIn: Date | null
  elapsedMinutes: number
}

export default function EmployeeDashboardV2() {
  const router = useRouter()
  const [session, setSession] = useState<WorkSession>({
    isWorking: false,
    clockIn: null,
    elapsedMinutes: 0,
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (session.isWorking && session.clockIn) {
        setSession((prev) => ({
          ...prev,
          elapsedMinutes: differenceInMinutes(new Date(), prev.clockIn!),
        }))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [session.isWorking, session.clockIn])

  const handleClockIn = () => {
    setSession({
      isWorking: true,
      clockIn: new Date(),
      elapsedMinutes: 0,
    })
  }

  const handleClockOut = () => {
    setSession({
      isWorking: false,
      clockIn: null,
      elapsedMinutes: 0,
    })
  }

  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const secs = (new Date().getSeconds())
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Cześć, Anna! 👋
          </h1>
          <p className="text-lg text-gray-600">
            {format(currentTime, 'EEEE, d MMMM yyyy', { locale: pl })}
          </p>
        </div>

        {/* Giant Clock / Timer */}
        <div className="relative">
          <Card variant="glass" hover={false} className="overflow-visible p-8 md:p-12">
            {!session.isWorking ? (
              /* Clock Display */
              <div className="text-center">
                <div className="mb-8">
                  <div className="mb-4 text-7xl font-bold tracking-tighter text-gray-800 md:text-9xl">
                    {format(currentTime, 'HH:mm')}
                  </div>
                  <div className="text-2xl text-gray-500">
                    {format(currentTime, 'ss')} sec
                  </div>
                </div>

                <Button
                  onClick={handleClockIn}
                  size="xl"
                  variant="success"
                  glow
                  className="min-w-[280px]"
                  leftIcon={<span className="text-3xl">▶️</span>}
                >
                  Rozpocznij pracę
                </Button>
              </div>
            ) : (
              /* Working Timer */
              <div className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-green-600">
                    W pracy
                  </span>
                </div>

                <div className="mb-8">
                  <div className="mb-4 font-mono text-7xl font-bold text-green-600 md:text-9xl">
                    {formatElapsedTime(session.elapsedMinutes)}
                  </div>
                  <div className="text-lg text-gray-600">
                    Rozpoczęto: {session.clockIn ? format(session.clockIn, 'HH:mm') : '--:--'}
                  </div>
                </div>

                <Button
                  onClick={handleClockOut}
                  size="xl"
                  variant="danger"
                  glow
                  className="min-w-[280px]"
                  leftIcon={<span className="text-3xl">⏹️</span>}
                >
                  Zakończ pracę
                </Button>
              </div>
            )}
          </Card>

          {/* Floating stats */}
          {session.isWorking && (
            <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
              <div className="rounded-full bg-white px-6 py-3 shadow-lg">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Godziny dziś</div>
                  <div className="text-lg font-bold text-gray-800">
                    {(session.elapsedMinutes / 60).toFixed(1)}h
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Shift */}
        <Card variant="glass">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">📅 Dzisiejsza zmiana</h3>
              <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-800">
                Kelnerka
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🕐</span>
                <div>
                  <div className="text-sm text-gray-500">Start</div>
                  <div className="text-lg font-semibold">09:00</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">🕔</span>
                <div>
                  <div className="text-sm text-gray-500">Koniec</div>
                  <div className="text-lg font-semibold">17:00</div>
                </div>
              </div>
            </div>

            {/* Timeline progress */}
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>Postęp zmiany</span>
                <span>50%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card variant="glass" hover className="cursor-pointer">
            <CardBody className="text-center">
              <div className="mb-2 text-4xl">📅</div>
              <div className="text-sm font-semibold">Kalendarz</div>
            </CardBody>
          </Card>

          <Card variant="glass" hover className="cursor-pointer">
            <CardBody className="text-center">
              <div className="mb-2 text-4xl">🗓️</div>
              <div className="text-sm font-semibold">Dostępność</div>
            </CardBody>
          </Card>

          <Card variant="glass" hover className="cursor-pointer">
            <CardBody className="text-center">
              <div className="mb-2 text-4xl">💰</div>
              <div className="text-sm font-semibold">Podsumowanie</div>
            </CardBody>
          </Card>

          <Card variant="glass" hover className="cursor-pointer">
            <CardBody className="text-center">
              <div className="mb-2 text-4xl">⚙️</div>
              <div className="text-sm font-semibold">Ustawienia</div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

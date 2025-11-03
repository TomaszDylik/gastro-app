/**
 * Futuristic Stat Card Component
 * For displaying KPIs and metrics with animations
 */

import { ReactNode } from 'react'
import { Card, CardBody } from './Card'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'glass' | 'gradient' | 'neon'
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'glass',
  className,
}: StatCardProps) {
  return (
    <Card variant={variant} hover className={className}>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl text-white shadow-lg">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

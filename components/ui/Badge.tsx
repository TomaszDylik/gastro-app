/**
 * Futuristic Badge Component
 * For status indicators, role labels, counts
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'employee' | 'manager' | 'owner' | 'admin'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  children: ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  size = 'md',
  glow = false,
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border border-emerald-400',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-400',
    danger: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border border-rose-400',
    info: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border border-cyan-400',
    employee: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-blue-400',
    manager: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-400',
    owner: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border border-orange-400',
    admin: 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const glowEffect = glow
    ? 'shadow-lg shadow-current/30'
    : ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        variants[variant],
        sizes[size],
        glowEffect,
        className
      )}
    >
      {children}
    </span>
  )
}

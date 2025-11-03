/**
 * Futurystyczny Card Component
 * Z glassmorphism, hover effects, gradient borders
 */

import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'neon'
  hover?: boolean
  glow?: boolean
  children: ReactNode
}

export function Card({
  variant = 'default',
  hover = true,
  glow = false,
  children,
  className,
  ...props
}: CardProps) {
  const baseStyles =
    'relative rounded-2xl transition-all duration-300 overflow-hidden'

  const variants = {
    default:
      'bg-white shadow-lg border border-gray-200',
    glass:
      'bg-white/70 backdrop-blur-xl shadow-xl border border-white/20',
    gradient:
      'bg-gradient-to-br from-white via-gray-50 to-white shadow-2xl border border-gray-100',
    neon:
      'bg-gray-900 shadow-2xl border border-purple-500/50 shadow-purple-500/20',
  }

  const hoverEffect = hover
    ? 'hover:-translate-y-1 hover:shadow-2xl'
    : ''

  const glowEffect = glow
    ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-violet-600/20 before:via-transparent before:to-purple-600/20 before:blur-xl before:-z-10'
    : ''

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverEffect,
        glowEffect,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-b border-gray-100 p-6', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-gray-100 p-6', className)}>
      {children}
    </div>
  )
}

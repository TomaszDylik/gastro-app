/**
 * Futuristic Input Component
 * Variants: default, glass, neon
 * Features: icons, validation states, animations
 */

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass' | 'neon'
  error?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  label?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      error = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white border-gray-300 focus:border-violet-500 focus:ring-violet-500/20',
      glass: 'bg-white/70 backdrop-blur-xl border-white/20 focus:border-white/40 focus:ring-white/10',
      neon: 'bg-gray-900 border-purple-500/50 focus:border-purple-500 focus:ring-purple-500/20 text-white placeholder:text-gray-400',
    }

    const errorStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : ''

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border px-4 py-3 transition-all duration-200',
              'focus:outline-none focus:ring-2',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              variants[variant],
              errorStyles,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-500' : 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

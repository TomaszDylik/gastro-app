'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ProfileMenuProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: 'employee' | 'manager' | 'super_admin'
    restaurantName?: string
  }
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRoleBadgeVariant = () => {
    switch (user.role) {
      case 'employee':
        return 'employee'
      case 'manager':
        return 'manager'
      case 'super_admin':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getRoleLabel = () => {
    switch (user.role) {
      case 'employee':
        return 'Pracownik'
      case 'manager':
        return 'Menedżer'
      case 'super_admin':
        return 'Administrator'
      default:
        return user.role
    }
  }

  const getInitials = () => {
    const firstInitial = user.firstName?.[0] || user.email?.[0] || 'U'
    const lastInitial = user.lastName?.[0] || user.email?.[1] || 'S'
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  const getAvatarGradient = () => {
    switch (user.role) {
      case 'employee':
        return 'from-cyan-500 to-blue-500'
      case 'manager':
        return 'from-orange-500 to-amber-500'
      case 'super_admin':
        return 'from-red-500 to-orange-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          isOpen && 'bg-gray-100'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center',
            'text-white font-bold text-sm shadow-md',
            getAvatarGradient()
          )}
        >
          {getInitials()}
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <div className="font-semibold text-sm text-gray-900">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-gray-500">{user.restaurantName || user.email}</div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200',
            'animate-in fade-in slide-in-from-top-2 duration-200 z-50'
          )}
        >
          {/* User Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center',
                  'text-white font-bold shadow-md',
                  getAvatarGradient()
                )}
              >
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant()}>{getRoleLabel()}</Badge>
              {user.restaurantName && (
                <span className="text-xs text-gray-500 truncate">{user.restaurantName}</span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'hover:bg-gray-100 transition-colors',
                'text-gray-700 hover:text-gray-900'
              )}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Ustawienia</span>
            </Link>

            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'hover:bg-red-50 transition-colors',
                'text-red-600 hover:text-red-700'
              )}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Wyloguj</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

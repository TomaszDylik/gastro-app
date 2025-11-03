'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckSquare,
  UserCheck,
  Building2,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
  badge?: string | number
}

interface SidebarProps {
  userRole: 'employee' | 'manager' | 'super_admin'
  restaurantId?: string
}

export function Sidebar({ userRole, restaurantId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Define menu items based on role
  const getMenuItems = (): MenuItem[] => {
    const baseRestaurantPath = restaurantId ? `/restaurant/${restaurantId}` : '/manager'

    if (userRole === 'employee') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee'] },
        { label: 'Podsumowanie', href: '/summary', icon: FileText, roles: ['employee'] },
        { label: 'Kalendarz', href: '/calendar', icon: Calendar, roles: ['employee'] },
        { label: 'Dostępność', href: '/availability', icon: CheckSquare, roles: ['employee'] },
        { label: 'Ustawienia', href: '/settings', icon: Settings, roles: ['employee'] },
      ]
    }

    if (userRole === 'manager') {
      return [
        { label: 'Dashboard', href: `${baseRestaurantPath}/dashboard`, icon: LayoutDashboard, roles: ['manager'] },
        { label: 'Czas pracy', href: `${baseRestaurantPath}/time`, icon: Clock, roles: ['manager'] },
        { label: 'Zespół', href: `${baseRestaurantPath}/team`, icon: Users, roles: ['manager'] },
        { label: 'Harmonogramy', href: `${baseRestaurantPath}/schedules`, icon: Calendar, roles: ['manager'] },
        { label: 'Ustawienia', href: '/settings', icon: Settings, roles: ['manager'] },
      ]
    }

    if (userRole === 'super_admin') {
      return [
        { label: 'Panel Admin', href: '/admin', icon: Shield, roles: ['super_admin'] },
        { label: 'Restauracje', href: '/admin/restaurants', icon: Building2, roles: ['super_admin'] },
        { label: 'Użytkownicy', href: '/admin/users', icon: Users, roles: ['super_admin'] },
        { label: 'Ustawienia', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
      ]
    }

    return []
  }

  const menuItems = getMenuItems()

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === '/dashboard' || href.endsWith('/dashboard')) {
      return pathname === href
    }
    // Starts with for other routes
    return pathname.startsWith(href)
  }

  const getRoleGradient = () => {
    switch (userRole) {
      case 'employee':
        return 'from-cyan-600 to-blue-600'
      case 'manager':
        return 'from-orange-600 to-amber-600'
      case 'super_admin':
        return 'from-red-600 to-orange-600'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
        'hidden lg:block',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br', getRoleGradient())} />
                <span className="font-bold text-lg">Gastro</span>
              </div>
            )}
            {collapsed && (
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br mx-auto', getRoleGradient())} />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href as any}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'hover:bg-gray-100',
                      active && cn('bg-gradient-to-r text-white shadow-md', getRoleGradient()),
                      !active && 'text-gray-700 hover:text-gray-900'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
              'bg-gray-100 hover:bg-gray-200 transition-colors',
              'text-gray-700 hover:text-gray-900'
            )}
            title={collapsed ? 'Rozwiń' : 'Zwiń'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Zwiń</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  FileText,
  CheckSquare,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  userRole: 'employee' | 'manager' | 'super_admin'
  restaurantId?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

export function MobileBottomNav({ userRole, restaurantId }: MobileBottomNavProps) {
  const pathname = usePathname()

  const getNavItems = (): NavItem[] => {
    const baseRestaurantPath = restaurantId ? `/manager/${restaurantId}` : '/manager'

    if (userRole === 'employee') {
      return [
        { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
        { label: 'Podsumowanie', href: '/employee/summary', icon: FileText },
        { label: 'Kalendarz', href: '/employee/calendar', icon: Calendar },
        { label: 'Dostępność', href: '/employee/availability', icon: CheckSquare },
        { label: 'Ustawienia', href: '/employee/settings', icon: Settings },
      ]
    }

    if (userRole === 'manager') {
      return [
        { label: 'Dashboard', href: `${baseRestaurantPath}/dashboard`, icon: LayoutDashboard },
        { label: 'Czas', href: `${baseRestaurantPath}/time`, icon: Clock },
        { label: 'Zespół', href: `${baseRestaurantPath}/team`, icon: Users },
        { label: 'Harmonogramy', href: `${baseRestaurantPath}/schedules`, icon: Calendar },
      ]
    }

    if (userRole === 'super_admin') {
      return [
        { label: 'Admin', href: '/admin', icon: Shield },
        { label: 'Restauracje', href: '/admin/restaurants', icon: LayoutDashboard },
        { label: 'Użytkownicy', href: '/admin/users', icon: Users },
        { label: 'Ustawienia', href: '/admin/settings', icon: Settings },
      ]
    }

    return []
  }

  const navItems = getNavItems()

  const isActive = (href: string) => {
    if (href === '/employee/dashboard' || href.endsWith('/dashboard')) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const getRoleColor = () => {
    switch (userRole) {
      case 'employee':
        return 'text-cyan-600'
      case 'manager':
        return 'text-orange-600'
      case 'super_admin':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40',
        'lg:hidden', // Hide on desktop
        'safe-area-bottom' // Support for notch/home indicator on mobile
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                'min-w-0 flex-1 max-w-[20%]',
                active ? cn('bg-gray-100', getRoleColor()) : 'text-gray-600',
                'active:scale-95'
              )}
            >
              <Icon className={cn('w-6 h-6 flex-shrink-0', active && 'scale-110')} />
              <span className={cn('text-xs font-medium truncate w-full text-center', active && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

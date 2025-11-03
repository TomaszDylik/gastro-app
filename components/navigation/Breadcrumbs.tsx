'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[]
  userRole?: 'employee' | 'manager' | 'super_admin'
}

export function Breadcrumbs({ customItems, userRole = 'employee' }: BreadcrumbsProps) {
  const pathname = usePathname()

  // If custom items provided, use them
  if (customItems) {
    return (
      <nav className="flex items-center space-x-2 text-sm">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>
        {customItems.map((item, index) => (
          <div key={item.href} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {index === customItems.length - 1 ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <Link
                href={item.href as any}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    )
  }

  // Auto-generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return null
  }

  const breadcrumbs: BreadcrumbItem[] = []

  // Helper to get readable labels
  const getLabel = (segment: string, index: number): string => {
    // Handle dynamic routes
    if (segment.startsWith('cm') && segment.length > 10) {
      // Looks like an ID
      return 'Details'
    }

    // Common route labels
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'summary': 'Podsumowanie',
      'calendar': 'Kalendarz',
      'availability': 'Dostępność',
      'settings': 'Ustawienia',
      'team': 'Zespół',
      'schedules': 'Harmonogramy',
      'time': 'Czas pracy',
      'reports': 'Raporty',
      'restaurant': 'Restauracja',
      'manager': 'Manager',
      'admin': 'Administrator',
      'users': 'Użytkownicy',
      'restaurants': 'Restauracje',
    }

    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  // Build breadcrumb path
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    breadcrumbs.push({
      label: getLabel(segment, index),
      href: currentPath,
    })
  })

  // Get role-specific color
  const getRoleColor = () => {
    switch (userRole) {
      case 'employee':
        return 'text-cyan-600 hover:text-cyan-700'
      case 'manager':
        return 'text-orange-600 hover:text-orange-700'
      case 'super_admin':
        return 'text-red-600 hover:text-red-700'
      default:
        return 'text-gray-600 hover:text-gray-700'
    }
  }

  return (
    <nav className="flex items-center space-x-2 text-sm py-2">
      <Link
        href="/dashboard"
        className={cn('transition-colors', getRoleColor())}
        title="Dashboard"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-semibold text-gray-900">{item.label}</span>
          ) : (
            <Link
              href={item.href as any}
              className={cn('transition-colors', getRoleColor())}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

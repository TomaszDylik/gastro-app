'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav'
import { ProfileMenu } from '@/components/navigation/ProfileMenu'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'

interface UserData {
  firstName: string
  lastName: string
  email: string
  role: 'employee' | 'manager' | 'super_admin'
  restaurantName?: string
  restaurantId?: string
  membershipId?: string
}

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            restaurantName: data.restaurantName,
            restaurantId: data.restaurantId,
            membershipId: data.membershipId,
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Ładowanie...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <Sidebar userRole={user.role} restaurantId={user.restaurantId} />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Logo & Breadcrumbs */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Mobile Logo */}
              <div className="lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600" />
              </div>
              {/* Breadcrumbs */}
              <div className="hidden md:block">
                <Breadcrumbs userRole={user.role} />
              </div>
            </div>

            {/* Right: Profile Menu */}
            <ProfileMenu user={user} />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole={user.role} restaurantId={user.restaurantId} />
    </div>
  )
}

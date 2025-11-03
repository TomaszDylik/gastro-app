import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Sprawdź czy użytkownik jest zalogowany
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Publiczne ścieżki (dostępne bez logowania)
  const publicPaths = ['/login', '/auth/callback', '/invite']
  const isPublicPath = publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))

  // API routes - nie przekierowuj, zwróć 401
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  // Jeśli użytkownik NIE jest zalogowany i próbuje wejść na chronioną stronę
  if (!session && !isPublicPath) {
    // Dla API zwróć 401
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Dla zwykłych stron przekieruj na login
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Jeśli użytkownik JEST zalogowany i próbuje wejść na /login
  if (session && req.nextUrl.pathname === '/login') {
    // Pobierz rolę użytkownika i przekieruj na odpowiedni dashboard
    try {
      const appUser = await prisma.appUser.findUnique({
        where: { authUserId: session.user.id },
        include: {
          memberships: {
            where: { status: 'active' },
            include: { restaurant: true },
          },
        },
      })

      const role = appUser?.memberships[0]?.role || 'employee'
      const restaurantId = appUser?.memberships[0]?.restaurantId

      // Przekieruj na odpowiedni dashboard based on role
      let dashboardUrl = '/dashboard' // default: employee
      if (role === 'manager' && restaurantId) {
        dashboardUrl = `/restaurant/${restaurantId}/dashboard`
      } else if (role === 'super_admin') {
        dashboardUrl = '/admin'
      }

      const redirectUrl = new URL(dashboardUrl, req.url)
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error('Error fetching user role:', error)
      // Fallback to default dashboard
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Role-based access control
  if (session && !isApiRoute && !isPublicPath) {
    try {
      const appUser = await prisma.appUser.findUnique({
        where: { authUserId: session.user.id },
        include: {
          memberships: {
            where: { status: 'active' },
            include: { restaurant: true },
          },
        },
      })

      const role = appUser?.memberships[0]?.role || 'employee'
      const pathname = req.nextUrl.pathname

      // Check if user is trying to access a route they shouldn't
      const isManagerRoute = pathname.startsWith('/manager') || pathname.includes('/restaurant/')
      const isOwnerRoute = pathname.startsWith('/owner')
      const isAdminRoute = pathname.startsWith('/admin')

      // Employee routes are in (employee) group, accessible by all
      // But restrict access to manager/owner/admin routes
      if (isManagerRoute && role === 'employee') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      if (isAdminRoute && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('Error checking user permissions:', error)
    }
  }

  return res
}

// Konfiguracja - które ścieżki mają być chronione
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

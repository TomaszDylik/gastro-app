import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Sprawdź czy użytkownik jest zalogowany
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Publiczne ścieżki (dostępne bez logowania)
  const publicPaths = ['/login', '/auth/callback', '/invite', '/forgot-password', '/reset-password']
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
    // Przekieruj na główną stronę (/) która sama zrobi redirect na podstawie roli
    // Nie możemy tu sprawdzać roli bo middleware działa w Edge Runtime (brak Prisma)
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Note: Role-based access control jest wykonywane przez komponent strony
  // poprzez wywołanie /api/auth/me, ponieważ middleware działa w Edge Runtime
  // i nie może używać Prisma Client

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

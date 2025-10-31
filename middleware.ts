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
  const publicPaths = ['/login', '/auth/callback', '/invite']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Jeśli użytkownik NIE jest zalogowany i próbuje wejść na chronioną stronę
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Jeśli użytkownik JEST zalogowany i próbuje wejść na /login
  if (session && req.nextUrl.pathname === '/login') {
    // Przekieruj na dashboard (może być domyślnie employee dashboard)
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
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

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function redirectByRole() {
  const supabase = createClientComponentClient()

  try {
    // Pobierz sesję
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return '/login'
    }

    // Pobierz użytkownika i jego role
    const response = await fetch('/api/auth/me')
    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }

    const data = await response.json()

    // Sprawdź najwyższą rolę użytkownika
    if (data.memberships && data.memberships.length > 0) {
      const roles = data.memberships.map((m: any) => m.role)

      // Priorytet: super_admin > owner > manager > employee
      if (roles.includes('super_admin')) {
        return '/admin'
      }
      if (roles.includes('owner')) {
        return '/owner/dashboard'
      }
      if (roles.includes('manager')) {
        return '/manager/dashboard'
      }
      // Default: employee
      return '/dashboard'
    }

    // Fallback: jeśli brak memberships, idź na dashboard
    return '/dashboard'
  } catch (error) {
    console.error('Error in redirectByRole:', error)
    return '/dashboard' // Fallback
  }
}

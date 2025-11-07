import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jeśli nie zalogowany, przekieruj na login
  if (!session) {
    redirect('/login')
  }

  // Sprawdź rolę użytkownika
  try {
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        memberships: {
          where: { status: 'active' },
          include: {
            restaurant: true,
          },
        },
      },
    })

    if (!user || !user.memberships || user.memberships.length === 0) {
      // Brak memberships - przekieruj na employee dashboard
      redirect('/employee/dashboard')
    }

    // Sprawdź najwyższą rolę
    const roles = user.memberships.map((m) => m.role)

    // Priorytet: super_admin > owner > manager > employee
    if (roles.includes('super_admin')) {
      redirect('/admin')
    }
    if (roles.includes('owner')) {
      redirect('/owner/dashboard')
    }
    if (roles.includes('manager')) {
      redirect('/manager')
    }

    // Default: employee
    redirect('/employee/dashboard')
  } catch (error) {
    console.error('Error checking user role:', error)
    redirect('/employee/dashboard')
  } finally {
    await prisma.$disconnect()
  }
}

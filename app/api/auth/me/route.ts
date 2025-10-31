import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 1. Pobierz session z cookies
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          cookie: cookieStore.toString()
        }
      }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nie zalogowano' },
        { status: 401 }
      )
    }

    // 2. Pobierz dane użytkownika z Prisma
    const appUser = await prisma.appUser.findUnique({
      where: { authUserId: user.id },
      include: {
        memberships: {
          where: { status: 'active' },
          include: {
            restaurant: true
          }
        }
      }
    })

    if (!appUser) {
      return NextResponse.json(
        { error: 'Użytkownik nie istnieje w bazie danych' },
        { status: 404 }
      )
    }

    // 3. Znajdź aktywny membership (zakładamy pierwszą restaurację)
    const activeMembership = appUser.memberships[0]
    
    if (!activeMembership) {
      return NextResponse.json(
        { error: 'Użytkownik nie jest przypisany do żadnej restauracji' },
        { status: 404 }
      )
    }

    // 4. Zwróć dane użytkownika z rolą
    return NextResponse.json({
      id: appUser.id,
      authUserId: appUser.authUserId,
      name: appUser.name,
      email: user.email,
      phone: appUser.phone,
      role: activeMembership.role,
      restaurantId: activeMembership.restaurantId,
      restaurantName: activeMembership.restaurant.name,
      membershipId: activeMembership.id
    })

  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

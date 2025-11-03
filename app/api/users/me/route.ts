import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/me
 * 
 * Get current user profile with memberships
 */
export async function GET() {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get user from database
    const user = await prisma.appUser.findUnique({
      where: {
        authUserId: session.user.id
      },
      include: {
        memberships: {
          include: {
            restaurant: {
              include: {
                company: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // 3. Return user data
    return NextResponse.json({
      id: user.id,
      authUserId: user.authUserId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      hourlyRateDefaultPLN: user.hourlyRateDefaultPLN?.toString(),
      memberships: user.memberships.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        hourlyRateManagerPLN: m.hourlyRateManagerPLN?.toString(),
        restaurant: {
          id: m.restaurant.id,
          name: m.restaurant.name,
          timezone: m.restaurant.timezone,
          company: m.restaurant.company ? {
            id: m.restaurant.company.id,
            name: m.restaurant.company.name
          } : null
        }
      }))
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PATCH /api/users/me
 * 
 * Update current user profile
 * 
 * Body: { name?, phone?, locale?, hourlyRateDefaultPLN? }
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse body
    const body = await request.json()
    const { name, phone, locale, hourlyRateDefaultPLN } = body

    // 3. Update user
    const updatedUser = await prisma.appUser.update({
      where: {
        authUserId: session.user.id
      },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(locale !== undefined && { locale }),
        ...(hourlyRateDefaultPLN !== undefined && { 
          hourlyRateDefaultPLN: hourlyRateDefaultPLN ? parseFloat(hourlyRateDefaultPLN) : null 
        })
      }
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      locale: updatedUser.locale,
      hourlyRateDefaultPLN: updatedUser.hourlyRateDefaultPLN?.toString()
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

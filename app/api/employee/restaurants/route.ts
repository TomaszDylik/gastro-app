import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get app user with all memberships
    const appUser = await prisma.appUser.findUnique({
      where: { authUserId: authUser.id },
      include: {
        memberships: {
          where: {
            status: 'active',
          },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                timezone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!appUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Format response
    const restaurants = appUser.memberships.map((membership) => ({
      membershipId: membership.id,
      restaurantId: membership.restaurant.id,
      restaurantName: membership.restaurant.name,
      timezone: membership.restaurant.timezone,
      role: membership.role,
      joinedAt: membership.createdAt,
    }))

    return NextResponse.json({
      restaurants,
      total: restaurants.length,
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

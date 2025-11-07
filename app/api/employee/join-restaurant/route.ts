import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
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

    // Get request body
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find restaurant by token
    const restaurant = await prisma.restaurant.findUnique({
      where: { inviteToken: token },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    // Get app user
    const appUser = await prisma.appUser.findUnique({
      where: { authUserId: authUser.id },
      include: {
        memberships: {
          where: {
            restaurantId: restaurant.id,
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

    // Check if user already has membership
    if (appUser.memberships.length > 0) {
      return NextResponse.json(
        { error: 'Already a member of this restaurant' },
        { status: 400 }
      )
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: appUser.id,
        restaurantId: restaurant.id,
        role: 'employee',
        status: 'active',
      },
    })

    // Log the join
    await prisma.inviteLog.create({
      data: {
        restaurantId: restaurant.id,
        userId: appUser.id,
        action: 'token_used',
        token: token,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        role: membership.role,
      },
    })
  } catch (error) {
    console.error('Error joining restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to join restaurant' },
      { status: 500 }
    )
  }
}

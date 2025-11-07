import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { restaurantId: string } }
) {
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

    // Get user and verify they're a manager for this restaurant
    const user = await prisma.appUser.findUnique({
      where: { authUserId: authUser.id },
      include: {
        memberships: {
          where: {
            restaurantId: params.restaurantId,
            role: 'manager',
            status: 'active',
          },
        },
      },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized to manage this restaurant' },
        { status: 403 }
      )
    }

    // Generate new unique token (8 characters, URL-safe)
    const newToken = nanoid(8)

    // Update restaurant with new token
    const restaurant = await prisma.restaurant.update({
      where: { id: params.restaurantId },
      data: { inviteToken: newToken },
    })

    // Log the token regeneration
    await prisma.inviteLog.create({
      data: {
        restaurantId: params.restaurantId,
        userId: user.id,
        action: 'token_generated',
        token: newToken,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      token: newToken,
      restaurantName: restaurant.name,
    })
  } catch (error) {
    console.error('Error regenerating token:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate token' },
      { status: 500 }
    )
  }
}

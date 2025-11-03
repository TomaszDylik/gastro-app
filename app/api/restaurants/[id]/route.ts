import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurants/[id]
 *
 * Get single restaurant details (only if user has membership)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    //2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId: params.id,
        status: 'active',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: No active membership for this restaurant' },
        { status: 403 }
      )
    }

    // 4. Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
      include: {
        settings: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        settings: restaurant.settings,
        userRole: membership.role,
      },
    })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PATCH /api/restaurants/[id]
 *
 * Update restaurant (owner/manager only)
 *
 * Body: { name?, timezone?, companyId? }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check if user is owner or manager
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId: params.id,
        status: 'active',
        role: {
          in: ['owner', 'manager', 'super_admin'],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners and managers can update restaurant' },
        { status: 403 }
      )
    }

    // 4. Parse body
    const body = await request.json()
    const { name, timezone, companyId } = body

    // 5. Update restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(timezone !== undefined && { timezone }),
        ...(companyId !== undefined && { companyId: companyId || null }),
      },
      include: {
        settings: true,
      },
    })

    return NextResponse.json({
      restaurant: {
        id: updatedRestaurant.id,
        name: updatedRestaurant.name,
        timezone: updatedRestaurant.timezone,
        settings: updatedRestaurant.settings,
      },
    })
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * DELETE /api/restaurants/[id]
 *
 * Delete restaurant (owner/super_admin only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check if user is owner or super_admin
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId: params.id,
        status: 'active',
        role: {
          in: ['owner', 'super_admin'],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners can delete restaurant' },
        { status: 403 }
      )
    }

    // 4. Delete restaurant (will cascade delete related records)
    await prisma.restaurant.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Restaurant deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

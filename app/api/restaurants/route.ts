import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/restaurants
 * 
 * List all restaurants user has access to (based on memberships)
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

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        memberships: {
          where: {
            status: 'active'
          },
          include: {
            restaurant: {
              include: {
                company: true,
                settings: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Return restaurants
    const restaurants = user.memberships.map(m => ({
      id: m.restaurant.id,
      name: m.restaurant.name,
      timezone: m.restaurant.timezone,
      company: m.restaurant.company ? {
        id: m.restaurant.company.id,
        name: m.restaurant.company.name
      } : null,
      settings: m.restaurant.settings,
      userRole: m.role,
      userStatus: m.status
    }))

    return NextResponse.json({ restaurants })

  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * POST /api/restaurants
 * 
 * Create new restaurant (owner/super_admin only)
 * 
 * Body: { name, timezone, companyId? }
 */
export async function POST(request: NextRequest) {
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

    // 2. Get user and check if super_admin or owner
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        memberships: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.memberships.some(m => m.role === 'super_admin')
    const isOwner = user.memberships.some(m => m.role === 'owner')

    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners and super admins can create restaurants' },
        { status: 403 }
      )
    }

    // 3. Parse body
    const body = await request.json()
    const { name, timezone, companyId } = body

    if (!name || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, timezone' },
        { status: 400 }
      )
    }

    // 4. Create restaurant with settings
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        timezone,
        companyId: companyId || null,
        settings: {
          create: {}
        }
      },
      include: {
        company: true,
        settings: true
      }
    })

    // 5. Create owner membership for creator
    await prisma.membership.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        role: 'owner',
        status: 'active'
      }
    })

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        timezone: restaurant.timezone,
        company: restaurant.company,
        settings: restaurant.settings
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

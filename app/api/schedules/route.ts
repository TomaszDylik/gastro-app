/**
 * ETAP 12.2: Grafiki - Tworzenie kategorii (Schedule)
 *
 * POST /api/schedules
 * Body: {
 *   restaurantId: string
 *   name: string
 *   categoryType: 'kitchen' | 'service' | 'bar' | 'cleaning' | 'management'
 *   color?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, name, categoryType, color } = body

    // Mock auth
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission: manager, owner, super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json(
        { error: 'Forbidden - only managers can create schedules' },
        { status: 403 },
      )
    }

    // Validate input
    if (!restaurantId || !name || !categoryType) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, name, categoryType' },
        { status: 400 },
      )
    }

    // Valid category types
    const validTypes = ['kitchen', 'service', 'bar', 'cleaning', 'management']
    if (!validTypes.includes(categoryType)) {
      return NextResponse.json(
        { error: `Invalid categoryType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    // Check restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify manager access if not owner/admin
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId,
          role: 'manager',
          status: 'active',
        },
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden - you are not a manager of this restaurant' },
          { status: 403 },
        )
      }
    }

    // Create schedule (category)
    const schedule = await prisma.schedule.create({
      data: {
        restaurantId,
        name,
        categoryType,
        color: color || null,
      },
    })

    return NextResponse.json(
      {
        id: schedule.id,
        restaurantId: schedule.restaurantId,
        name: schedule.name,
        categoryType: schedule.categoryType,
        color: schedule.color,
        createdAt: schedule.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/schedules?restaurantId=xxx - List schedules for restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId parameter' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { restaurantId },
      include: {
        shifts: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ schedules }, { status: 200 })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

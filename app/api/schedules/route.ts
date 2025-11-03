/**
 * API: Schedules Management
 *
 * GET /api/schedules?restaurantId=xxx - List schedules for restaurant
 * POST /api/schedules - Create new schedule
 * Body: { restaurantId, name, isActive? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/schedules
 * Returns list of schedules for a restaurant with shift counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { restaurantId },
      include: {
        shifts: {
          select: {
            id: true,
            start: true,
            end: true,
            roleTag: true,
            assignments: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            shifts: true,
            availabilities: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to include statistics
    const schedulesWithStats = schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt.toISOString(),
      stats: {
        totalShifts: schedule._count.shifts,
        assignedShifts: schedule.shifts.reduce(
          (count, shift) => count + shift.assignments.filter(a => a.status === 'assigned').length,
          0
        ),
        completedShifts: schedule.shifts.reduce(
          (count, shift) => count + shift.assignments.filter(a => a.status === 'completed').length,
          0
        ),
        availabilities: schedule._count.availabilities,
        timeEntries: schedule._count.timeEntries,
      },
    }))

    return NextResponse.json({
      schedules: schedulesWithStats,
      total: schedulesWithStats.length,
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules
 * Creates a new schedule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, name, isActive } = body

    // Validate input
    if (!restaurantId || !name) {
      return NextResponse.json(
        { error: 'restaurantId and name are required' },
        { status: 400 }
      )
    }

    // Check restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        restaurantId,
        name,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(
      {
        id: schedule.id,
        restaurantId: schedule.restaurantId,
        name: schedule.name,
        isActive: schedule.isActive,
        createdAt: schedule.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

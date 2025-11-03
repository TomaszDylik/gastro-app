import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/time-entries/clock-in
 * 
 * Clock in for a shift assignment or manually.
 * Creates a new TimeEntry with clockIn timestamp.
 * 
 * Body:
 * - membershipId: string (required)
 * - scheduleId: string (required)
 * - clockIn?: string (ISO8601, optional - defaults to now)
 * - reason?: string (optional note)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membershipId, scheduleId, clockIn, reason } = body

    // Validation
    if (!membershipId || !scheduleId) {
      return NextResponse.json(
        { error: 'membershipId and scheduleId are required' },
        { status: 400 }
      )
    }

    // Check if membership exists and is active
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        restaurant: true,
        user: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    if (membership.status !== 'active') {
      return NextResponse.json(
        { error: 'Membership is not active' },
        { status: 403 }
      )
    }

    // Check if schedule exists and belongs to the same restaurant
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    if (schedule.restaurantId !== membership.restaurantId) {
      return NextResponse.json(
        { error: 'Schedule does not belong to the membership restaurant' },
        { status: 403 }
      )
    }

    // Check if there's already an open TimeEntry (clockIn without clockOut)
    const openTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        membershipId,
        scheduleId,
        clockOut: null
      }
    })

    if (openTimeEntry) {
      return NextResponse.json(
        { 
          error: 'ALREADY_CLOCKED_IN',
          message: 'You already have an open time entry. Clock out first.',
          openTimeEntry
        },
        { status: 409 }
      )
    }

    // Create TimeEntry
    const clockInTime = clockIn ? new Date(clockIn) : new Date()

    const timeEntry = await prisma.timeEntry.create({
      data: {
        membershipId,
        scheduleId,
        clockIn: clockInTime,
        source: 'manual',
        status: 'active',
        reason: reason || null
      },
      include: {
        membership: {
          include: {
            user: true
          }
        },
        schedule: true
      }
    })

    return NextResponse.json({ 
      success: true,
      timeEntry 
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Clock-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

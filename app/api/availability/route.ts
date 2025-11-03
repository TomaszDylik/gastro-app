/**
 * API: Availability Management
 * 
 * GET /api/availability - Get user's weekly availability grid
 * Query: membershipId
 * Returns: 7 days × 3 time slots (morning, afternoon, evening)
 * 
 * PUT /api/availability - Update user's weekly availability
 * Body: {
 *   membershipId: string
 *   availability: {
 *     [day: string]: {
 *       morning: boolean
 *       afternoon: boolean
 *       evening: boolean
 *     }
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, AvailabilityStatus } from '@prisma/client'
import { startOfWeek, addDays, setHours, setMinutes, endOfWeek } from 'date-fns'

const prisma = new PrismaClient()

// Time slot definitions
const TIME_SLOTS = {
  morning: { start: 6, end: 14 },    // 06:00-14:00
  afternoon: { start: 14, end: 22 }, // 14:00-22:00
  evening: { start: 18, end: 2 },    // 18:00-02:00 (next day)
}

const DAYS_MAP = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/**
 * GET /api/availability
 * Returns weekly availability grid for a membership
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')

    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId is required' },
        { status: 400 }
      )
    }

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Get current week's availability
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

    const availabilities = await prisma.availability.findMany({
      where: {
        membershipId,
        start: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: { in: ['proposed', 'accepted'] },
      },
    })

    // Build availability grid
    const grid: Record<string, Record<string, boolean>> = {}
    
    DAYS_MAP.forEach((day, index) => {
      grid[day] = {
        morning: false,
        afternoon: false,
        evening: false,
      }

      const dayDate = addDays(weekStart, index)

      // Check each time slot
      Object.entries(TIME_SLOTS).forEach(([slot, times]) => {
        const slotStart = setMinutes(setHours(dayDate, times.start), 0)
        let slotEnd = setMinutes(setHours(dayDate, times.end), 0)
        
        // Handle evening slot that goes into next day
        if (times.end < times.start) {
          slotEnd = addDays(slotEnd, 1)
        }

        // Check if there's any availability record covering this slot
        const hasAvailability = availabilities.some(avail => {
          const availStart = new Date(avail.start)
          const availEnd = new Date(avail.end)
          
          // Check if availability overlaps with this slot
          return availStart <= slotEnd && availEnd >= slotStart
        })

        grid[day][slot] = hasAvailability
      })
    })

    return NextResponse.json({
      availability: grid,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/availability
 * Updates weekly availability grid for a membership
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { membershipId, availability } = body

    if (!membershipId || !availability) {
      return NextResponse.json(
        { error: 'membershipId and availability are required' },
        { status: 400 }
      )
    }

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Get current week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday

    // Delete existing availability records for this week
    await prisma.availability.deleteMany({
      where: {
        membershipId,
        start: {
          gte: weekStart,
          lte: endOfWeek(weekStart, { weekStartsOn: 1 }),
        },
      },
    })

    // Create new availability records
    const records = []
    
    for (let i = 0; i < DAYS_MAP.length; i++) {
      const day = DAYS_MAP[i]
      const dayDate = addDays(weekStart, i)
      const dayAvailability = availability[day]

      if (!dayAvailability) continue

      for (const [slot, isAvailable] of Object.entries(dayAvailability)) {
        if (!isAvailable) continue

        const times = TIME_SLOTS[slot as keyof typeof TIME_SLOTS]
        if (!times) continue

        let start = setMinutes(setHours(dayDate, times.start), 0)
        let end = setMinutes(setHours(dayDate, times.end), 0)

        // Handle evening slot that goes into next day
        if (times.end < times.start) {
          end = addDays(end, 1)
        }

        records.push({
          membershipId,
          start,
          end,
          status: 'proposed' as AvailabilityStatus,
        })
      }
    }

    // Bulk create
    if (records.length > 0) {
      await prisma.availability.createMany({
        data: records,
      })
    }

    return NextResponse.json({
      message: 'Availability updated successfully',
      recordsCreated: records.length,
      weekStart: weekStart.toISOString(),
    })

  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

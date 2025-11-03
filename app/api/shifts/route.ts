/**
 * ETAP 12.2: Zmiany (Shifts) - Create/Update
 *
 * POST /api/shifts - Create new shift
 * Body: {
 *   scheduleId: string
 *   startTime: string (ISO)
 *   endTime: string (ISO)
 *   requiredEmployees?: number
 * }
 *
 * Waliduje brak nakładania się zmian w tej samej kategorii
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Shift } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, startTime, endTime, requiredEmployees } = body

    // Mock auth
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission: manager, owner, super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json({ error: 'Forbidden - only managers can create shifts' }, {
        status: 403,
      })
    }

    // Validate input
    if (!scheduleId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: scheduleId, startTime, endTime' },
        { status: 400 },
      )
    }

    // Check schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { restaurant: true },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Verify manager access if not owner/admin
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId: schedule.restaurantId,
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

    // Validate times
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json({ error: 'startTime must be before endTime' }, { status: 400 })
    }

    // Check for overlapping shifts in the same schedule (category)
    const overlappingShifts = await prisma.shift.findMany({
      where: {
        scheduleId,
        OR: [
          {
            start: { lte: end },
            end: { gte: start },
          },
        ],
      },
    })

    if (overlappingShifts.length > 0) {
      return NextResponse.json(
        {
          error: 'Shift overlaps with existing shifts in this category',
          overlappingShifts: overlappingShifts.map((s: Shift) => ({
            id: s.id,
            start: s.start,
            end: s.end,
          })),
        },
        { status: 409 },
      )
    }

    // Create shift
    const shift = await prisma.shift.create({
      data: {
        scheduleId,
        start,
        end,
        roleTag: null,
        notes: null,
      },
    })

    return NextResponse.json(
      {
        id: shift.id,
        scheduleId: shift.scheduleId,
        start: shift.start,
        end: shift.end,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

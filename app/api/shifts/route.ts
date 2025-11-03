/**
 * ETAP 12.2: Zmiany (Shifts) - Create/Update/List
 *
 * GET /api/shifts - List shifts for a user (calendar view)
 * Query: membershipId, month (YYYY-MM)
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
import { startOfMonth, endOfMonth } from 'date-fns'

const prisma = new PrismaClient()

/**
 * GET /api/shifts
 * Returns shift assignments for a user for a given month (calendar view)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')
    const monthParam = searchParams.get('month')

    // Validation
    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId is required' },
        { status: 400 }
      )
    }

    // Parse month (default to current month)
    const targetDate = monthParam ? new Date(monthParam + '-01') : new Date()
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Check if membership exists
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        restaurant: true,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Fetch shift assignments for the user in the given month
    const shiftAssignments = await prisma.shiftAssignment.findMany({
      where: {
        membershipId,
        shift: {
          start: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      },
      include: {
        shift: {
          include: {
            schedule: true,
          },
        },
      },
      orderBy: {
        shift: {
          start: 'asc',
        },
      },
    })

    // Transform to calendar format
    const shifts = shiftAssignments.map(assignment => {
      const shift = assignment.shift
      const date = shift.start.toISOString().split('T')[0]
      const start = shift.start.toTimeString().substring(0, 5) // HH:mm
      const end = shift.end.toTimeString().substring(0, 5) // HH:mm

      return {
        id: shift.id,
        assignmentId: assignment.id,
        date,
        start,
        end,
        role: shift.roleTag || shift.schedule.name,
        scheduleName: shift.schedule.name,
        status: assignment.status,
        notes: shift.notes,
      }
    })

    // Calculate stats
    const confirmedCount = shifts.filter(s => s.status === 'completed' || s.status === 'assigned').length
    const pendingCount = shifts.filter(s => s.status === 'assigned').length
    
    // Calculate planned hours (only for assigned/completed shifts)
    const plannedHours = shifts
      .filter(s => s.status === 'assigned' || s.status === 'completed')
      .reduce((total, shift) => {
        const assignment = shiftAssignments.find(a => a.id === shift.assignmentId)
        if (assignment) {
          const hours = (assignment.shift.end.getTime() - assignment.shift.start.getTime()) / 1000 / 60 / 60
          return total + hours
        }
        return total
      }, 0)

    return NextResponse.json({
      shifts,
      stats: {
        total: shifts.length,
        confirmed: confirmedCount,
        pending: pendingCount,
        declined: shifts.filter(s => s.status === 'declined').length,
        plannedHours: Number(plannedHours.toFixed(1)),
      },
      month: targetDate.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
    })

  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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

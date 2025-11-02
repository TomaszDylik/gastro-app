import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { validateNoOverlap, type ShiftTimeSlot } from '@/lib/shift-overlap'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/shifts/validate
 * 
 * Validate that a shift doesn't overlap with existing shifts for the same employee.
 * 
 * Request body:
 * {
 *   shiftId?: string,          // Optional - when editing existing shift
 *   membershipId: string,      // Employee's membership ID
 *   start: string,             // ISO 8601 date string
 *   end: string,               // ISO 8601 date string
 * }
 * 
 * Response:
 * {
 *   valid: boolean,
 *   conflicts?: Array<{
 *     conflictingShiftId: string,
 *     overlapStart: string,
 *     overlapEnd: string,
 *     overlapMinutes: number
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { shiftId, membershipId, start, end } = body

    if (!membershipId || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: membershipId, start, end' },
        { status: 400 }
      )
    }

    // 3. Parse dates
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    // 4. Get existing shifts for this employee
    // Find all shifts assigned to this membership
    const existingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        membershipId: membershipId,
        status: {
          in: ['assigned', 'completed']
        }
      },
      include: {
        shift: true
      }
    })

    // Extract shifts as ShiftTimeSlot objects
    const existingShifts: ShiftTimeSlot[] = existingAssignments.map(assignment => ({
      id: assignment.shift.id,
      start: assignment.shift.start,
      end: assignment.shift.end,
      membershipId: assignment.membershipId
    }))

    // 5. Validate overlap
    const newShift: ShiftTimeSlot = {
      id: shiftId,
      start: startDate,
      end: endDate,
      membershipId: membershipId
    }

    const validationResult = validateNoOverlap(newShift, existingShifts)

    // 6. Return result
    if (validationResult.hasOverlap) {
      return NextResponse.json({
        valid: false,
        conflicts: validationResult.conflicts.map(conflict => ({
          conflictingShiftId: conflict.conflictingShiftId,
          overlapStart: conflict.overlapStart.toISOString(),
          overlapEnd: conflict.overlapEnd.toISOString(),
          overlapMinutes: conflict.overlapMinutes
        }))
      })
    }

    return NextResponse.json({
      valid: true
    })

  } catch (error) {
    console.error('Error validating shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

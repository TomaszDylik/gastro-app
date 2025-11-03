import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { checkShiftOverlap, validateShiftTimes } from '@/lib/shift-overlap-validation'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/shifts/validate
 *
 * Validate that a shift doesn't overlap with existing shifts for the same employee.
 * Checks across ALL schedules/categories for the member.
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
 *   error?: string,
 *   conflictingShift?: {
 *     id: string,
 *     scheduleId: string,
 *     scheduleName: string,
 *     start: string,
 *     end: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // 3. Parse and validate dates
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    try {
      validateShiftTimes(startDate, endDate)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 4. Check for overlapping shifts across ALL schedules
    const result = await checkShiftOverlap({
      membershipId,
      newShiftStart: startDate,
      newShiftEnd: endDate,
      excludeShiftId: shiftId,
    })

    // 5. Return validation result
    if (result.hasOverlap) {
      return NextResponse.json(
        {
          valid: false,
          error: 'SHIFT_OVERLAP_FOR_MEMBER',
          conflictingShift: {
            id: result.conflictingShift!.id,
            scheduleId: result.conflictingShift!.scheduleId,
            scheduleName: result.conflictingShift!.scheduleName,
            start: result.conflictingShift!.start.toISOString(),
            end: result.conflictingShift!.end.toISOString(),
          },
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      valid: true,
    })
  } catch (error) {
    console.error('Error validating shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

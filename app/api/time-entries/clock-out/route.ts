import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/time-entries/clock-out
 * 
 * Clock out from an open TimeEntry.
 * Updates the TimeEntry with clockOut timestamp.
 * 
 * Body:
 * - timeEntryId?: string (optional - if not provided, finds open TimeEntry for membershipId)
 * - membershipId?: string (required if timeEntryId not provided)
 * - scheduleId?: string (required if timeEntryId not provided)
 * - clockOut?: string (ISO8601, optional - defaults to now)
 * - adjustmentMinutes?: number (optional - for DST or corrections)
 * - reason?: string (optional - can update reason on clock-out)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timeEntryId, membershipId, scheduleId, clockOut, adjustmentMinutes, reason } = body

    let timeEntry

    // Find TimeEntry by ID or by open entry for membership
    if (timeEntryId) {
      timeEntry = await prisma.timeEntry.findUnique({
        where: { id: timeEntryId },
        include: {
          membership: {
            include: { user: true }
          },
          schedule: true
        }
      })

      if (!timeEntry) {
        return NextResponse.json(
          { error: 'TimeEntry not found' },
          { status: 404 }
        )
      }
    } else if (membershipId && scheduleId) {
      // Find open TimeEntry
      timeEntry = await prisma.timeEntry.findFirst({
        where: {
          membershipId,
          scheduleId,
          clockOut: null
        },
        include: {
          membership: {
            include: { user: true }
          },
          schedule: true
        }
      })

      if (!timeEntry) {
        return NextResponse.json(
          { 
            error: 'NO_OPEN_TIME_ENTRY',
            message: 'No open time entry found. Clock in first.'
          },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Either timeEntryId or (membershipId + scheduleId) required' },
        { status: 400 }
      )
    }

    // Check if already clocked out
    if (timeEntry.clockOut) {
      return NextResponse.json(
        { 
          error: 'ALREADY_CLOCKED_OUT',
          message: 'This time entry is already closed.',
          timeEntry
        },
        { status: 409 }
      )
    }

    // Update TimeEntry with clockOut
    const clockOutTime = clockOut ? new Date(clockOut) : new Date()

    // Validate clockOut > clockIn
    if (clockOutTime <= timeEntry.clockIn) {
      return NextResponse.json(
        { error: 'clockOut must be after clockIn' },
        { status: 400 }
      )
    }

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut: clockOutTime,
        adjustmentMinutes: adjustmentMinutes || timeEntry.adjustmentMinutes,
        reason: reason !== undefined ? reason : timeEntry.reason
      },
      include: {
        membership: {
          include: { user: true }
        },
        schedule: true
      }
    })

    // Calculate duration
    const durationMs = clockOutTime.getTime() - timeEntry.clockIn.getTime()
    const durationMinutes = Math.round(durationMs / 60000)

    return NextResponse.json({ 
      success: true,
      timeEntry: updatedTimeEntry,
      durationMinutes
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Clock-out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { closeHangingTimeEntry } from '@/lib/time-entry-permissions'

const prisma = new PrismaClient()

/**
 * POST /api/time-entries/close-hanging
 * 
 * Manager can close a TimeEntry that has clockIn but no clockOut.
 * Sets clockOut to shift.end or specified time.
 * 
 * Body:
 * - timeEntryId: string (required)
 * - closedByUserId: string (required - must be manager/owner)
 * - closeTime?: string (ISO8601, optional - defaults to shift.end or now)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timeEntryId, closedByUserId, closeTime } = body

    // Validation
    if (!timeEntryId || !closedByUserId) {
      return NextResponse.json(
        { error: 'timeEntryId and closedByUserId are required' },
        { status: 400 }
      )
    }

    // Verify user is manager/owner
    const user = await prisma.appUser.findUnique({
      where: { id: closedByUserId },
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

    // Check if user has manager/owner role in any restaurant
    const hasManagerRole = user.memberships.some(
      m => m.role === 'manager' || m.role === 'owner'
    )

    if (!hasManagerRole) {
      return NextResponse.json(
        { error: 'Only managers can close hanging time entries' },
        { status: 403 }
      )
    }

    // Close hanging entry
    const closeTimeDate = closeTime ? new Date(closeTime) : undefined
    
    const updatedTimeEntry = await closeHangingTimeEntry(
      timeEntryId,
      closedByUserId,
      closeTimeDate
    )

    return NextResponse.json({
      success: true,
      timeEntry: updatedTimeEntry
    })

  } catch (error: any) {
    console.error('❌ Close hanging entry error:', error)
    
    if (error.message === 'TimeEntry not found') {
      return NextResponse.json(
        { error: 'TimeEntry not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'TimeEntry already has clockOut') {
      return NextResponse.json(
        { error: 'TimeEntry already has clockOut' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

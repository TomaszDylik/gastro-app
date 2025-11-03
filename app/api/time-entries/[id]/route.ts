import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { canEditTimeEntry } from '@/lib/time-entry-permissions'
import { createAuditLog } from '@/lib/audit'

const prisma = new PrismaClient()

/**
 * PATCH /api/time-entries/[id]
 *
 * Edit a TimeEntry (update clockIn, clockOut, reason, adjustmentMinutes).
 *
 * Permissions:
 * - Worker can edit their own TimeEntry ONLY if ReportDaily not signed
 * - Manager can edit any TimeEntry ONLY if ReportDaily not signed
 * - After signature: immutable
 *
 * Body:
 * - clockIn?: string (ISO8601)
 * - clockOut?: string (ISO8601)
 * - reason?: string
 * - adjustmentMinutes?: number
 * - userId: string (required - ID of user making the edit)
 * - userRole: 'employee' | 'manager' | 'owner' (required)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timeEntryId = params.id
    const body = await request.json()
    const { clockIn, clockOut, reason, adjustmentMinutes, userId, userRole } = body

    // Validation
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'userId and userRole are required' }, { status: 400 })
    }

    // Check permissions
    const permissionCheck = await canEditTimeEntry(timeEntryId, userId, userRole)

    if (!permissionCheck.canEdit) {
      return NextResponse.json(
        { error: permissionCheck.reason || 'Cannot edit this TimeEntry' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (clockIn !== undefined) {
      updateData.clockIn = new Date(clockIn)
    }

    if (clockOut !== undefined) {
      if (clockOut === null) {
        updateData.clockOut = null
      } else {
        updateData.clockOut = new Date(clockOut)
      }
    }

    if (reason !== undefined) {
      updateData.reason = reason
    }

    if (adjustmentMinutes !== undefined) {
      updateData.adjustmentMinutes = adjustmentMinutes
    }

    // Validate clockIn < clockOut if both present
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'TimeEntry not found' }, { status: 404 })
    }

    const finalClockIn = updateData.clockIn || timeEntry.clockIn
    const finalClockOut =
      updateData.clockOut !== undefined ? updateData.clockOut : timeEntry.clockOut

    if (finalClockOut && finalClockOut <= finalClockIn) {
      return NextResponse.json({ error: 'clockOut must be after clockIn' }, { status: 400 })
    }

    // Update TimeEntry
    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: updateData,
      include: {
        membership: {
          include: { user: true, restaurant: true },
        },
        schedule: true,
      },
    })

    // Log the edit to audit
    await createAuditLog({
      actorUserId: userId,
      restaurantId: updatedTimeEntry.membership.restaurantId,
      entityType: 'TimeEntry',
      entityId: timeEntryId,
      action: 'time_entry.edit',
      before: {
        clockIn: timeEntry.clockIn.toISOString(),
        clockOut: timeEntry.clockOut?.toISOString() || null,
        reason: timeEntry.reason,
        adjustmentMinutes: timeEntry.adjustmentMinutes,
      },
      after: {
        clockIn: updatedTimeEntry.clockIn.toISOString(),
        clockOut: updatedTimeEntry.clockOut?.toISOString() || null,
        reason: updatedTimeEntry.reason,
        adjustmentMinutes: updatedTimeEntry.adjustmentMinutes,
        editedBy: userRole,
      },
    })

    return NextResponse.json({
      success: true,
      timeEntry: updatedTimeEntry,
    })
  } catch (error) {
    console.error('❌ TimeEntry edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

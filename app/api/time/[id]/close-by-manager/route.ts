/**
 * ETAP 12.3: POST /api/time/[id]/close-by-manager
 *
 * Manager zamyka wpis czasu (nawet jeśli pracownik nie skończył zmiany)
 * Przydatne gdy pracownik zapomniał odznaczyć koniec zmiany
 *
 * POST /api/time/[id]/close-by-manager
 * Body: {
 *   clockOut: string (ISO) - forced end time
 *   reason: string - powód zamknięcia przez managera
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAuditLog } from '@/lib/audit'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: timeEntryId } = params
    const body = await request.json()
    const { clockOut, reason } = body

    // Mock auth
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission: manager, owner, super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json(
        { error: 'Forbidden - only managers can force-close time entries' },
        { status: 403 },
      )
    }

    if (!clockOut || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: clockOut, reason' },
        { status: 400 },
      )
    }

    // Find time entry
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
      include: {
        membership: {
          include: {
            restaurant: true,
            user: true,
          },
        },
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    // Verify manager access
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId: timeEntry.membership.restaurantId,
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

    // Check if already has clockOut
    if (timeEntry.clockOut) {
      return NextResponse.json(
        { error: 'Time entry already has clockOut time' },
        { status: 400 },
      )
    }

    const clockOutTime = new Date(clockOut)

    // Validate clockOut is after clockIn
    if (clockOutTime <= timeEntry.clockIn) {
      return NextResponse.json(
        { error: 'clockOut must be after clockIn' },
        { status: 400 },
      )
    }

    // Update time entry
    const updated = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        clockOut: clockOutTime,
        status: 'approved',
        reason,
      },
    })

    // Audit log
    await createAuditLog({
      actorUserId,
      restaurantId: timeEntry.membership.restaurantId,
      entityType: 'time_entry',
      entityId: timeEntryId,
      action: 'time_entry.close_by_manager',
      before: { clockOut: null, status: timeEntry.status },
      after: {
        clockOut: clockOutTime.toISOString(),
        status: 'approved',
        reason,
        closedBy: actorUserId,
      },
    })

    return NextResponse.json(
      {
        id: updated.id,
        membershipId: updated.membershipId,
        clockIn: updated.clockIn,
        clockOut: updated.clockOut,
        status: updated.status,
        reason: updated.reason,
        employee: {
          id: timeEntry.membership.user.id,
          name: timeEntry.membership.user.name,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error closing time entry by manager:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

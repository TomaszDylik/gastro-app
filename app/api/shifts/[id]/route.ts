/**
 * ETAP 12.2: PATCH /api/shifts/[id] - Update shift
 *
 * PATCH /api/shifts/[id]
 * Body: {
 *   start?: string (ISO)
 *   end?: string (ISO)
 *   roleTag?: string
 *   notes?: string
 * }
 *
 * Waliduje brak nakładania po edycji
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Shift } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const body = await request.json()
    const { start, end, roleTag, notes } = body

    // Mock auth
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission: manager, owner, super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json({ error: 'Forbidden - only managers can update shifts' }, {
        status: 403,
      })
    }

    // Find existing shift
    const existingShift = await prisma.shift.findUnique({
      where: { id },
      include: {
        schedule: { include: { restaurant: true } },
      },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Verify manager access
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId: existingShift.schedule.restaurantId,
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

    // Prepare update data
    const updateData: any = {}
    if (start) updateData.start = new Date(start)
    if (end) updateData.end = new Date(end)
    if (roleTag !== undefined) updateData.roleTag = roleTag
    if (notes !== undefined) updateData.notes = notes

    // If times are being updated, validate no overlap
    if (start || end) {
      const newStart = start ? new Date(start) : existingShift.start
      const newEnd = end ? new Date(end) : existingShift.end

      if (newStart >= newEnd) {
        return NextResponse.json({ error: 'start must be before end' }, { status: 400 })
      }

      // Check for overlaps (excluding current shift)
      const overlappingShifts = await prisma.shift.findMany({
        where: {
          scheduleId: existingShift.scheduleId,
          id: { not: id }, // Exclude current shift
          OR: [
            {
              start: { lte: newEnd },
              end: { gte: newStart },
            },
          ],
        },
      })

      if (overlappingShifts.length > 0) {
        return NextResponse.json(
          {
            error: 'Updated shift would overlap with existing shifts',
            overlappingShifts: overlappingShifts.map((s: Shift) => ({
              id: s.id,
              start: s.start,
              end: s.end,
            })),
          },
          { status: 409 },
        )
      }
    }

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(
      {
        id: updatedShift.id,
        scheduleId: updatedShift.scheduleId,
        start: updatedShift.start,
        end: updatedShift.end,
        roleTag: updatedShift.roleTag,
        notes: updatedShift.notes,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

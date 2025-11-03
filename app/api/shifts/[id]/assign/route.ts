/**
 * ETAP 12.2: POST /api/shifts/[id]/assign - Przypisz pracownika do zmiany
 *
 * Sprawdza konflikty czasowe dla pracownika (czy nie ma już przypisanej innej zmiany w tym czasie)
 *
 * POST /api/shifts/[id]/assign
 * Body: {
 *   userId: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: shiftId } = params
    const body = await request.json()
    const { userId } = body

    // Mock auth
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission: manager, owner, super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json({ error: 'Forbidden - only managers can assign shifts' }, {
        status: 403,
      })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Find shift
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        schedule: { include: { restaurant: true } },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Verify manager access
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId: shift.schedule.restaurantId,
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

    // Check if employee exists and is member of this restaurant
    const employeeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        restaurantId: shift.schedule.restaurantId,
        status: 'active',
      },
    })

    if (!employeeMembership) {
      return NextResponse.json(
        { error: 'Employee not found or not a member of this restaurant' },
        { status: 404 },
      )
    }

    // Check for conflicts - employee already assigned to another shift at this time
    const conflictingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        userId,
        status: 'assigned',
        shift: {
          OR: [
            {
              start: { lte: shift.end },
              end: { gte: shift.start },
            },
          ],
        },
      },
      include: {
        shift: {
          select: {
            id: true,
            start: true,
            end: true,
          },
        },
      },
    })

    if (conflictingAssignments.length > 0) {
      return NextResponse.json(
        {
          error: 'Employee already assigned to another shift at this time',
          conflictingShifts: conflictingAssignments.map((a) => ({
            assignmentId: a.id,
            shiftId: a.shift.id,
            start: a.shift.start,
            end: a.shift.end,
          })),
        },
        { status: 409 },
      )
    }

    // Create assignment
    const assignment = await prisma.shiftAssignment.create({
      data: {
        shiftId,
        userId,
        status: 'assigned',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shift: {
          select: {
            id: true,
            start: true,
            end: true,
            schedule: {
              select: {
                name: true,
                categoryType: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        id: assignment.id,
        shiftId: assignment.shiftId,
        userId: assignment.userId,
        status: assignment.status,
        user: assignment.user,
        shift: {
          id: assignment.shift.id,
          start: assignment.shift.start,
          end: assignment.shift.end,
          category: assignment.shift.schedule.name,
          categoryType: assignment.shift.schedule.categoryType,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error assigning shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

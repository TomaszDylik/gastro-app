/**
 * ETAP 12.2: POST /api/shifts/[id]/assign - Przypisz pracownika do zmiany
 *
 * Sprawdza konflikty czasowe dla pracownika (czy nie ma już przypisanej innej zmiany w tym czasie)
 *
 * POST /api/shifts/[id]/assign
 * Body: {
 *   membershipId: string
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
    const { membershipId } = body

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

    if (!membershipId) {
      return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 })
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

    // Check if membership exists and is for this restaurant
    const employeeMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    })

    if (!employeeMembership || employeeMembership.restaurantId !== shift.schedule.restaurantId) {
      return NextResponse.json(
        { error: 'Membership not found or not for this restaurant' },
        { status: 404 },
      )
    }

    // Check for conflicts - employee already assigned to another shift at this time
    const conflictingAssignments = await prisma.shiftAssignment.findMany({
      where: {
        membershipId,
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
        membershipId,
        status: 'assigned',
      },
      include: {
        membership: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
        membershipId: assignment.membershipId,
        status: assignment.status,
        employee: {
          id: assignment.membership.user.id,
          name: assignment.membership.user.name,
          email: assignment.membership.user.email,
        },
        shift: {
          id: assignment.shift.id,
          start: assignment.shift.start,
          end: assignment.shift.end,
          scheduleName: assignment.shift.schedule.name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error assigning shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

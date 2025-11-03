/**
 * API: Single Schedule Management
 *
 * GET /api/schedules/[id] - Get schedule details with shifts
 * PUT /api/schedules/[id] - Update schedule
 * DELETE /api/schedules/[id] - Delete schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/schedules/[id]
 * Returns schedule details with all shifts and assignments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        shifts: {
          include: {
            assignments: {
              include: {
                membership: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            start: 'asc',
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Transform shifts to include formatted data
    const shiftsFormatted = schedule.shifts.map(shift => ({
      id: shift.id,
      start: shift.start.toISOString(),
      end: shift.end.toISOString(),
      roleTag: shift.roleTag,
      notes: shift.notes,
      assignments: shift.assignments.map(assignment => ({
        id: assignment.id,
        status: assignment.status,
        member: {
          id: assignment.membership.id,
          userId: assignment.membership.user.id,
          name: assignment.membership.user.name,
          email: assignment.membership.user.email,
          role: assignment.membership.role,
        },
      })),
    }))

    return NextResponse.json({
      id: schedule.id,
      name: schedule.name,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt.toISOString(),
      restaurant: schedule.restaurant,
      shifts: shiftsFormatted,
      stats: {
        totalShifts: shiftsFormatted.length,
        totalAssignments: shiftsFormatted.reduce((sum, s) => sum + s.assignments.length, 0),
      },
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/schedules/[id]
 * Updates schedule name and/or isActive status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id
    const body = await request.json()
    const { name, isActive } = body

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Update schedule
    const updateData: { name?: string; isActive?: boolean } = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
    })

    return NextResponse.json({
      id: schedule.id,
      name: schedule.name,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt.toISOString(),
      message: 'Schedule updated successfully',
    })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/schedules/[id]
 * Deletes schedule and all associated shifts/assignments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        shifts: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Delete in transaction: assignments → shifts → availabilities → time entries → schedule
    await prisma.$transaction(async (tx) => {
      // Delete shift assignments
      for (const shift of schedule.shifts) {
        await tx.shiftAssignment.deleteMany({
          where: { shiftId: shift.id },
        })
      }

      // Delete shifts
      await tx.shift.deleteMany({
        where: { scheduleId },
      })

      // Delete availabilities
      await tx.availability.deleteMany({
        where: { scheduleId },
      })

      // Delete time entries
      await tx.timeEntry.deleteMany({
        where: { scheduleId },
      })

      // Delete schedule
      await tx.schedule.delete({
        where: { id: scheduleId },
      })
    })

    return NextResponse.json({
      message: 'Schedule deleted successfully',
      deletedScheduleId: scheduleId,
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

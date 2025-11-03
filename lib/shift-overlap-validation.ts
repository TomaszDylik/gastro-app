/**
 * Shift Overlap Validation
 *
 * Validates that a member doesn't have overlapping shifts across all schedules.
 * Handles:
 * - Shifts spanning midnight
 * - DST transitions
 * - Exact minute boundaries
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ShiftTimeRange {
  start: Date
  end: Date
}

/**
 * Check if two time ranges overlap
 * Uses half-open interval: [start, end)
 *
 * Ranges overlap if: start1 < end2 AND start2 < end1
 */
export function doTimeRangesOverlap(range1: ShiftTimeRange, range2: ShiftTimeRange): boolean {
  return range1.start < range2.end && range2.start < range1.end
}

/**
 * Check if a member has overlapping shifts
 *
 * @param membershipId - The membership to check
 * @param newShiftStart - Start time of the new/updated shift
 * @param newShiftEnd - End time of the new/updated shift
 * @param excludeShiftId - Optional: exclude this shift ID (for updates)
 * @returns Object with overlap status and conflicting shift details
 */
export async function checkShiftOverlap(params: {
  membershipId: string
  newShiftStart: Date
  newShiftEnd: Date
  excludeShiftId?: string
}): Promise<{
  hasOverlap: boolean
  conflictingShift?: {
    id: string
    scheduleId: string
    scheduleName: string
    start: Date
    end: Date
  }
}> {
  const { membershipId, newShiftStart, newShiftEnd, excludeShiftId } = params

  // Get all shift assignments for this member
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      membershipId,
      status: {
        in: ['assigned', 'completed'],
      },
      ...(excludeShiftId && {
        shiftId: {
          not: excludeShiftId,
        },
      }),
    },
    include: {
      shift: {
        include: {
          schedule: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Check each existing shift for overlap
  for (const assignment of assignments) {
    const existingShift = assignment.shift

    if (
      doTimeRangesOverlap(
        { start: newShiftStart, end: newShiftEnd },
        { start: existingShift.start, end: existingShift.end }
      )
    ) {
      return {
        hasOverlap: true,
        conflictingShift: {
          id: existingShift.id,
          scheduleId: existingShift.scheduleId,
          scheduleName: existingShift.schedule.name,
          start: existingShift.start,
          end: existingShift.end,
        },
      }
    }
  }

  return { hasOverlap: false }
}

/**
 * Calculate actual worked hours accounting for DST transitions
 *
 * In Poland (Europe/Warsaw):
 * - Spring forward: last Sunday of March at 02:00 → 03:00 (lose 1 hour)
 * - Fall back: last Sunday of October at 03:00 → 02:00 (gain 1 hour)
 *
 * @returns Actual hours worked (can be fractional)
 */
export function calculateActualHours(
  start: Date,
  end: Date,
  adjustmentMinutes: number = 0
): number {
  // Get milliseconds difference
  const msWorked = end.getTime() - start.getTime()

  // Convert to hours
  const hoursWorked = msWorked / (1000 * 60 * 60)

  // Add adjustment
  const adjustmentHours = adjustmentMinutes / 60

  // Round to 2 decimal places
  return Math.round((hoursWorked + adjustmentHours) * 100) / 100
}

/**
 * Validate shift times
 *
 * @throws Error if validation fails
 */
export function validateShiftTimes(start: Date, end: Date): void {
  if (start >= end) {
    throw new Error('Shift start must be before end time')
  }

  // Maximum shift duration: 24 hours
  const maxDuration = 24 * 60 * 60 * 1000 // 24 hours in ms
  if (end.getTime() - start.getTime() > maxDuration) {
    throw new Error('Shift duration cannot exceed 24 hours')
  }
}

/**
 * Shift Overlap Validation
 *
 * Detects time conflicts between shifts to prevent double-booking employees.
 */

export interface ShiftTimeSlot {
  id?: string
  start: Date
  end: Date
  membershipId?: string
}

export interface OverlapConflict {
  conflictingShiftId: string
  overlapStart: Date
  overlapEnd: Date
  overlapMinutes: number
}

export interface ValidationResult {
  hasOverlap: boolean
  conflicts: OverlapConflict[]
}

/**
 * Check if two time ranges overlap
 *
 * @param a First time slot
 * @param b Second time slot
 * @returns True if the time slots overlap
 */
function doTimeSlotsOverlap(a: ShiftTimeSlot, b: ShiftTimeSlot): boolean {
  // Shifts overlap if:
  // - A starts before B ends AND A ends after B starts
  return a.start < b.end && a.end > b.start
}

/**
 * Calculate overlap details between two time slots
 *
 * @param a First time slot
 * @param b Second time slot
 * @returns Overlap details or null if no overlap
 */
function calculateOverlap(
  a: ShiftTimeSlot,
  b: ShiftTimeSlot
): { start: Date; end: Date; minutes: number } | null {
  if (!doTimeSlotsOverlap(a, b)) {
    return null
  }

  const overlapStart = a.start > b.start ? a.start : b.start
  const overlapEnd = a.end < b.end ? a.end : b.end
  const overlapMs = overlapEnd.getTime() - overlapStart.getTime()
  const overlapMinutes = Math.floor(overlapMs / (1000 * 60))

  return {
    start: overlapStart,
    end: overlapEnd,
    minutes: overlapMinutes,
  }
}

/**
 * Validate that a new shift doesn't overlap with existing shifts for the same employee
 *
 * @param newShift The shift to validate
 * @param existingShifts Array of existing shifts for the same employee
 * @returns Validation result with conflict details
 */
export function validateNoOverlap(
  newShift: ShiftTimeSlot,
  existingShifts: ShiftTimeSlot[]
): ValidationResult {
  const conflicts: OverlapConflict[] = []

  for (const existing of existingShifts) {
    // Skip comparing shift with itself (when editing)
    if (newShift.id && existing.id === newShift.id) {
      continue
    }

    const overlap = calculateOverlap(newShift, existing)

    if (overlap) {
      conflicts.push({
        conflictingShiftId: existing.id || 'unknown',
        overlapStart: overlap.start,
        overlapEnd: overlap.end,
        overlapMinutes: overlap.minutes,
      })
    }
  }

  return {
    hasOverlap: conflicts.length > 0,
    conflicts,
  }
}

/**
 * Format overlap conflict for display
 *
 * @param conflict The overlap conflict to format
 * @returns Human-readable description
 */
export function formatOverlapConflict(conflict: OverlapConflict): string {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return `Conflict with shift ${conflict.conflictingShiftId}: ${formatTime(conflict.overlapStart)} - ${formatTime(conflict.overlapEnd)} (${conflict.overlapMinutes} minutes)`
}

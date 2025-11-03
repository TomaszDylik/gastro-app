import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Check if a TimeEntry can be edited based on ReportDaily signature status.
 * 
 * Rules:
 * - Worker can edit their own TimeEntry ONLY if ReportDaily for that date is NOT signed
 * - Manager can edit any TimeEntry ONLY if ReportDaily for that date is NOT signed
 * - After ReportDaily is signed: NO edits allowed (immutable)
 * 
 * @param timeEntryId - ID of the TimeEntry to check
 * @param userId - ID of the user attempting to edit
 * @param userRole - Role of the user ('employee', 'manager', 'owner')
 * @returns { canEdit: boolean, reason?: string }
 */
export async function canEditTimeEntry(
  timeEntryId: string,
  userId: string,
  userRole: 'employee' | 'manager' | 'owner'
): Promise<{ canEdit: boolean; reason?: string }> {
  // Get TimeEntry with membership info
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: {
      membership: {
        include: {
          user: true,
          restaurant: true
        }
      },
      schedule: true
    }
  })

  if (!timeEntry) {
    return { canEdit: false, reason: 'TimeEntry not found' }
  }

  // Extract date from clockIn
  const entryDate = new Date(timeEntry.clockIn)
  entryDate.setHours(0, 0, 0, 0)

  // Check if ReportDaily exists and is signed for this date
  const reportDaily = await prisma.reportDaily.findUnique({
    where: {
      restaurantId_date: {
        restaurantId: timeEntry.membership.restaurantId,
        date: entryDate
      }
    }
  })

  // If report is signed, no edits allowed
  if (reportDaily && reportDaily.signedAt) {
    return { 
      canEdit: false, 
      reason: 'ReportDaily is already signed for this date. No edits allowed.' 
    }
  }

  // Check ownership for employees
  if (userRole === 'employee') {
    if (timeEntry.membership.userId !== userId) {
      return { 
        canEdit: false, 
        reason: 'You can only edit your own time entries.' 
      }
    }
  }

  // Managers and owners can edit any TimeEntry (as long as not signed)
  // Employees can edit their own (as long as not signed)
  return { canEdit: true }
}

/**
 * Manager can close a TimeEntry that has clockIn but no clockOut (hanging shift).
 * Sets clockOut to shift.end or current time if no shift assigned.
 * 
 * @param timeEntryId - ID of the TimeEntry to close
 * @param closedByUserId - ID of the manager closing the entry
 * @param closeTime - Optional time to set as clockOut (defaults to now)
 * @returns Updated TimeEntry
 */
export async function closeHangingTimeEntry(
  timeEntryId: string,
  closedByUserId: string,
  closeTime?: Date
) {
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    include: {
      membership: {
        include: {
          shiftAssignments: {
            include: {
              shift: true
            }
          }
        }
      }
    }
  })

  if (!timeEntry) {
    throw new Error('TimeEntry not found')
  }

  if (timeEntry.clockOut) {
    throw new Error('TimeEntry already has clockOut')
  }

  // Determine close time:
  // 1. Use provided closeTime
  // 2. Find matching shift.end (if assigned to a shift that overlaps)
  // 3. Default to now
  let clockOutTime = closeTime || new Date()

  if (!closeTime && timeEntry.membership.shiftAssignments.length > 0) {
    // Find shift that covers the clockIn time
    const matchingShift = timeEntry.membership.shiftAssignments.find(sa => {
      const shift = sa.shift
      return shift.start <= timeEntry.clockIn && shift.end > timeEntry.clockIn
    })

    if (matchingShift) {
      clockOutTime = matchingShift.shift.end
    }
  }

  // Calculate adjustment minutes if closing at shift end (might span DST)
  const durationMs = clockOutTime.getTime() - timeEntry.clockIn.getTime()
  const actualHours = durationMs / (1000 * 60 * 60)
  const expectedHours = Math.round(actualHours * 100) / 100

  // Update TimeEntry
  const updatedEntry = await prisma.timeEntry.update({
    where: { id: timeEntryId },
    data: {
      clockOut: clockOutTime,
      adjustmentMinutes: timeEntry.adjustmentMinutes, // Keep existing or set to 0
      reason: timeEntry.reason 
        ? `${timeEntry.reason} (Closed by manager)`
        : 'Closed by manager'
    }
  })

  return updatedEntry
}

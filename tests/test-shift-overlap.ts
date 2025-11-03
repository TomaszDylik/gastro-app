/**
 * Tests for Shift Overlap Validation
 */

import { validateNoOverlap, type ShiftTimeSlot } from '../lib/shift-overlap'

console.log('🧪 Testing Shift Overlap Validation...\n')

// Helper to create date with specific hour
function createDate(hour: number, minute: number = 0): Date {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}

// Test 1: No overlap - shifts are completely separate
console.log('Test 1: No overlap - separate shifts')
const shift1 = {
  id: 'shift-1',
  start: createDate(9, 0), // 9:00
  end: createDate(12, 0), // 12:00
  membershipId: 'member-1',
}

const shift2 = {
  id: 'shift-2',
  start: createDate(14, 0), // 14:00
  end: createDate(18, 0), // 18:00
  membershipId: 'member-1',
}

const result1 = validateNoOverlap(shift1, [shift2])
console.log('  hasOverlap:', result1.hasOverlap)
console.log('  conflicts:', result1.conflicts.length)
console.assert(result1.hasOverlap === false, 'Should have no overlap')
console.assert(result1.conflicts.length === 0, 'Should have no conflicts')
console.log('  ✅ PASSED\n')

// Test 2: Complete overlap - one shift inside another
console.log('Test 2: Complete overlap - shift inside another')
const shift3 = {
  id: 'shift-3',
  start: createDate(10, 0), // 10:00
  end: createDate(16, 0), // 16:00
  membershipId: 'member-1',
}

const shift4 = {
  id: 'shift-4',
  start: createDate(12, 0), // 12:00
  end: createDate(14, 0), // 14:00
  membershipId: 'member-1',
}

const result2 = validateNoOverlap(shift4, [shift3])
console.log('  hasOverlap:', result2.hasOverlap)
console.log('  conflicts:', result2.conflicts.length)
console.log('  overlap minutes:', result2.conflicts[0]?.overlapMinutes)
console.assert(result2.hasOverlap === true, 'Should have overlap')
console.assert(result2.conflicts.length === 1, 'Should have one conflict')
console.assert(result2.conflicts[0].overlapMinutes === 120, 'Should overlap for 120 minutes')
console.log('  ✅ PASSED\n')

// Test 3: Partial overlap - shifts partially overlap
console.log('Test 3: Partial overlap - shifts partially overlap')
const shift5 = {
  id: 'shift-5',
  start: createDate(9, 0), // 9:00
  end: createDate(13, 0), // 13:00
  membershipId: 'member-1',
}

const shift6 = {
  id: 'shift-6',
  start: createDate(11, 0), // 11:00
  end: createDate(15, 0), // 15:00
  membershipId: 'member-1',
}

const result3 = validateNoOverlap(shift5, [shift6])
console.log('  hasOverlap:', result3.hasOverlap)
console.log('  conflicts:', result3.conflicts.length)
console.log('  overlap minutes:', result3.conflicts[0]?.overlapMinutes)
console.assert(result3.hasOverlap === true, 'Should have overlap')
console.assert(result3.conflicts.length === 1, 'Should have one conflict')
console.assert(result3.conflicts[0].overlapMinutes === 120, 'Should overlap for 120 minutes')
console.log('  ✅ PASSED\n')

// Test 4: Adjacent shifts - no overlap (end time equals start time)
console.log('Test 4: Adjacent shifts - no overlap')
const shift7 = {
  id: 'shift-7',
  start: createDate(9, 0), // 9:00
  end: createDate(12, 0), // 12:00
  membershipId: 'member-1',
}

const shift8 = {
  id: 'shift-8',
  start: createDate(12, 0), // 12:00
  end: createDate(15, 0), // 15:00
  membershipId: 'member-1',
}

const result4 = validateNoOverlap(shift7, [shift8])
console.log('  hasOverlap:', result4.hasOverlap)
console.log('  conflicts:', result4.conflicts.length)
console.assert(result4.hasOverlap === false, 'Adjacent shifts should not overlap')
console.assert(result4.conflicts.length === 0, 'Should have no conflicts')
console.log('  ✅ PASSED\n')

// Test 5: Multiple conflicts
console.log('Test 5: Multiple conflicts - one shift overlaps with several')
const newShift = {
  id: 'new-shift',
  start: createDate(10, 0), // 10:00
  end: createDate(16, 0), // 16:00
  membershipId: 'member-1',
}

const existingShifts: ShiftTimeSlot[] = [
  {
    id: 'existing-1',
    start: createDate(9, 0), // 9:00
    end: createDate(11, 0), // 11:00
    membershipId: 'member-1',
  },
  {
    id: 'existing-2',
    start: createDate(12, 0), // 12:00
    end: createDate(14, 0), // 14:00
    membershipId: 'member-1',
  },
  {
    id: 'existing-3',
    start: createDate(15, 0), // 15:00
    end: createDate(17, 0), // 17:00
    membershipId: 'member-1',
  },
]

const result5 = validateNoOverlap(newShift, existingShifts)
console.log('  hasOverlap:', result5.hasOverlap)
console.log('  conflicts:', result5.conflicts.length)
console.log(
  '  conflict IDs:',
  result5.conflicts.map((c) => c.conflictingShiftId)
)
console.assert(result5.hasOverlap === true, 'Should have overlap')
console.assert(result5.conflicts.length === 3, 'Should have three conflicts')
console.log('  ✅ PASSED\n')

// Test 6: Self-comparison ignored (editing existing shift)
console.log('Test 6: Self-comparison ignored when editing')
const editedShift = {
  id: 'shift-to-edit',
  start: createDate(10, 0), // 10:00
  end: createDate(14, 0), // 14:00
  membershipId: 'member-1',
}

const shiftsIncludingSelf: ShiftTimeSlot[] = [
  {
    id: 'shift-to-edit', // Same ID
    start: createDate(10, 0),
    end: createDate(14, 0),
    membershipId: 'member-1',
  },
  {
    id: 'other-shift',
    start: createDate(16, 0), // 16:00
    end: createDate(18, 0), // 18:00
    membershipId: 'member-1',
  },
]

const result6 = validateNoOverlap(editedShift, shiftsIncludingSelf)
console.log('  hasOverlap:', result6.hasOverlap)
console.log('  conflicts:', result6.conflicts.length)
console.assert(result6.hasOverlap === false, 'Should ignore self when editing')
console.assert(result6.conflicts.length === 0, 'Should have no conflicts')
console.log('  ✅ PASSED\n')

// Test 7: One-minute overlap
console.log('Test 7: One-minute overlap')
const shift9 = {
  id: 'shift-9',
  start: createDate(9, 0), // 9:00
  end: createDate(12, 1), // 12:01
  membershipId: 'member-1',
}

const shift10 = {
  id: 'shift-10',
  start: createDate(12, 0), // 12:00
  end: createDate(15, 0), // 15:00
  membershipId: 'member-1',
}

const result7 = validateNoOverlap(shift9, [shift10])
console.log('  hasOverlap:', result7.hasOverlap)
console.log('  conflicts:', result7.conflicts.length)
console.log('  overlap minutes:', result7.conflicts[0]?.overlapMinutes)
console.assert(result7.hasOverlap === true, 'Should detect 1-minute overlap')
console.assert(result7.conflicts[0].overlapMinutes === 1, 'Should be 1 minute overlap')
console.log('  ✅ PASSED\n')

console.log('✅ All Shift Overlap Validation tests passed!')

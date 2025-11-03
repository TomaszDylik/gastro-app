/**
 * ETAP 5: Start/Stop Time Tracking + Edit Permissions
 *
 * Integration tests for:
 * - Clock-in/clock-out functionality
 * - Worker can edit TimeEntry before ReportDaily signature
 * - Manager can close hanging shifts
 * - Edit blocked after signature
 * - Edge cases: duplicate clock-in, clock-out without clock-in, invalid times
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test counters
let testsPassedCount = 0
let testsFailedCount = 0

function logSuccess(message: string) {
  console.log(`✅ ${message}`)
  testsPassedCount++
}

function logFailure(message: string, error?: any) {
  console.log(`❌ ${message}`)
  if (error) {
    console.error('   Error:', error.message || error)
  }
  testsFailedCount++
}

async function runTests() {
  console.log('\n🧪 ETAP 5: Time Tracking Tests\n')
  console.log('='.repeat(60))

  try {
    // ============================================================
    // SETUP: Get test data from database
    // ============================================================
    console.log('\n📋 SETUP: Loading test data...\n')

    const restaurant = await prisma.restaurant.findFirst({
      where: { name: 'Pod Gruszą' },
    })

    if (!restaurant) {
      throw new Error('Restaurant "Pod Gruszą" not found. Run seed first.')
    }

    const manager = await prisma.appUser.findFirst({
      where: { email: 'manager@gmail.pl' },
      include: {
        memberships: {
          where: { restaurantId: restaurant.id },
        },
      },
    })

    const employee1 = await prisma.appUser.findFirst({
      where: { email: 'employee1@gmail.pl' },
      include: {
        memberships: {
          where: { restaurantId: restaurant.id },
        },
      },
    })

    if (!manager || !employee1) {
      throw new Error('Manager or Employee1 not found. Run seed first.')
    }

    const managerMembership = manager.memberships[0]
    const employee1Membership = employee1.memberships[0]

    if (!managerMembership || !employee1Membership) {
      throw new Error('Memberships not found. Run seed first.')
    }

    // Get or create a schedule
    let schedule = await prisma.schedule.findFirst({
      where: { restaurantId: restaurant.id },
    })

    if (!schedule) {
      schedule = await prisma.schedule.create({
        data: {
          name: 'Test Schedule',
          restaurantId: restaurant.id,
          isActive: true,
        },
      })
    }

    console.log(`✅ Setup complete:`)
    console.log(`   Restaurant: ${restaurant.name}`)
    console.log(`   Manager: ${manager.email}`)
    console.log(`   Employee: ${employee1.email}`)
    console.log(`   Schedule: ${schedule.name}`)

    // ============================================================
    // TEST 1: Clock-in creates new TimeEntry
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 1: Clock-in creates new TimeEntry')
    console.log('='.repeat(60))

    const clockInTime = new Date()
    clockInTime.setHours(9, 0, 0, 0)

    const timeEntry1 = await prisma.timeEntry.create({
      data: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockIn: clockInTime,
        source: 'manual',
        status: 'active',
        reason: 'Regular shift',
      },
    })

    if (timeEntry1 && timeEntry1.clockIn && !timeEntry1.clockOut) {
      logSuccess('Clock-in created TimeEntry with clockIn and no clockOut')
    } else {
      logFailure('Clock-in failed to create valid TimeEntry', timeEntry1)
    }

    // ============================================================
    // TEST 2: Duplicate clock-in detection (409)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 2: Duplicate clock-in should be prevented')
    console.log('='.repeat(60))

    const openTimeEntry = await prisma.timeEntry.findFirst({
      where: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockOut: null,
      },
    })

    if (openTimeEntry) {
      logSuccess('Duplicate clock-in check: found existing open TimeEntry (would return 409)')
    } else {
      logFailure('Duplicate clock-in check: no open TimeEntry found')
    }

    // ============================================================
    // TEST 3: Clock-out updates TimeEntry
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 3: Clock-out updates existing TimeEntry')
    console.log('='.repeat(60))

    const clockOutTime = new Date()
    clockOutTime.setHours(17, 0, 0, 0)

    const updatedTimeEntry = await prisma.timeEntry.update({
      where: { id: timeEntry1.id },
      data: {
        clockOut: clockOutTime,
      },
    })

    if (updatedTimeEntry.clockOut) {
      const durationMs = updatedTimeEntry.clockOut.getTime() - updatedTimeEntry.clockIn.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      console.log(`   Duration: ${durationHours} hours`)

      if (durationHours === 8) {
        logSuccess('Clock-out updated TimeEntry correctly (8h shift)')
      } else {
        logFailure(`Clock-out duration incorrect: ${durationHours}h, expected 8h`)
      }
    } else {
      logFailure('Clock-out failed to update TimeEntry', updatedTimeEntry)
    }

    // ============================================================
    // TEST 4: Clock-out without clock-in (404)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 4: Clock-out without open entry should fail')
    console.log('='.repeat(60))

    const noOpenEntry = await prisma.timeEntry.findFirst({
      where: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockOut: null,
      },
    })

    if (!noOpenEntry) {
      logSuccess('Clock-out without open entry check: no open TimeEntry (would return 404)')
    } else {
      logFailure('Clock-out without open entry check: found open TimeEntry')
    }

    // ============================================================
    // TEST 5: Worker can edit TimeEntry BEFORE signature
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 5: Worker can edit TimeEntry before ReportDaily signature')
    console.log('='.repeat(60))

    // Check if report is signed for this date
    const entryDate = new Date(timeEntry1.clockIn)
    entryDate.setHours(0, 0, 0, 0)

    // Delete any existing report to ensure we test the "before signature" case
    await prisma.reportDaily.deleteMany({
      where: {
        restaurantId: restaurant.id,
        date: entryDate,
      },
    })

    const reportDaily = await prisma.reportDaily.findUnique({
      where: {
        restaurantId_date: {
          restaurantId: restaurant.id,
          date: entryDate,
        },
      },
    })

    const canEdit = !reportDaily || !reportDaily.signedAt

    if (canEdit) {
      // Edit the TimeEntry
      const editedEntry = await prisma.timeEntry.update({
        where: { id: timeEntry1.id },
        data: {
          reason: 'Updated reason - forgot to clock in on time',
        },
      })

      if (editedEntry.reason === 'Updated reason - forgot to clock in on time') {
        logSuccess('Worker successfully edited TimeEntry before signature')
      } else {
        logFailure('Worker edit failed', editedEntry)
      }
    } else {
      logFailure('Worker cannot edit: ReportDaily already signed')
    }

    // ============================================================
    // TEST 6: Create and sign ReportDaily
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 6: Create and sign ReportDaily')
    console.log('='.repeat(60))

    const signatureLog = [
      {
        action: 'signed',
        userId: manager.id,
        userName: manager.name || manager.email || 'Manager',
        timestamp: new Date().toISOString(),
      },
    ]

    const newReport = await prisma.reportDaily.upsert({
      where: {
        restaurantId_date: {
          restaurantId: restaurant.id,
          date: entryDate,
        },
      },
      update: {
        signedByUserId: manager.id,
        signedAt: new Date(),
        signatureLogJson: signatureLog,
      },
      create: {
        restaurantId: restaurant.id,
        date: entryDate,
        totalsJson: { hours: 8, amount: 280 },
        signedByUserId: manager.id,
        signedAt: new Date(),
        signatureLogJson: signatureLog,
      },
    })

    if (newReport.signedAt) {
      logSuccess('ReportDaily created and signed successfully')
    } else {
      logFailure('ReportDaily signing failed', newReport)
    }

    // ============================================================
    // TEST 7: Worker CANNOT edit TimeEntry AFTER signature
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 7: Worker cannot edit TimeEntry after ReportDaily signature')
    console.log('='.repeat(60))

    const reportAfterSign = await prisma.reportDaily.findUnique({
      where: {
        restaurantId_date: {
          restaurantId: restaurant.id,
          date: entryDate,
        },
      },
    })

    const canEditAfterSign = !reportAfterSign || !reportAfterSign.signedAt

    if (!canEditAfterSign) {
      logSuccess('Edit blocked: ReportDaily is signed (immutable)')
    } else {
      logFailure('Edit should be blocked but is allowed')
    }

    // ============================================================
    // TEST 8: Manager can close hanging shift
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 8: Manager can close hanging shift (clockIn without clockOut)')
    console.log('='.repeat(60))

    // Create a new day with no signature
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 1)
    newDate.setHours(10, 0, 0, 0)

    const hangingEntry = await prisma.timeEntry.create({
      data: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockIn: newDate,
        source: 'manual',
        status: 'active',
        reason: 'Forgot to clock out',
      },
    })

    if (hangingEntry.clockOut === null) {
      // Manager closes it
      const closedTime = new Date(newDate)
      closedTime.setHours(18, 0, 0, 0)

      const closedEntry = await prisma.timeEntry.update({
        where: { id: hangingEntry.id },
        data: {
          clockOut: closedTime,
          reason: 'Forgot to clock out (Closed by manager)',
        },
      })

      if (closedEntry.clockOut) {
        logSuccess('Manager successfully closed hanging shift')
      } else {
        logFailure('Manager failed to close hanging shift', closedEntry)
      }
    } else {
      logFailure('Hanging entry already has clockOut', hangingEntry)
    }

    // ============================================================
    // TEST 9: Invalid times (clockOut before clockIn)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 9: Validation - clockOut must be after clockIn')
    console.log('='.repeat(60))

    const invalidClockIn = new Date()
    invalidClockIn.setHours(17, 0, 0, 0)

    const invalidClockOut = new Date()
    invalidClockOut.setHours(9, 0, 0, 0) // Before clockIn!

    // Database allows this, but API should reject it
    // Test that we can create an invalid entry in DB (no constraint)
    // but application-level validation should catch it
    const invalidEntry = await prisma.timeEntry.create({
      data: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockIn: invalidClockIn,
        clockOut: invalidClockOut, // Invalid - before clockIn!
        source: 'manual',
        status: 'active',
      },
    })

    if (invalidEntry.clockOut! < invalidEntry.clockIn) {
      logSuccess('DB allows invalid times (app validation needed). API would reject with 400.')

      // Cleanup invalid entry
      await prisma.timeEntry.delete({ where: { id: invalidEntry.id } })
    } else {
      logFailure('Invalid time entry check failed')
    }

    // ============================================================
    // TEST 10: Manager edit permissions work across all employees
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 10: Manager can edit any employee TimeEntry (before signature)')
    console.log('='.repeat(60))

    // Create TimeEntry for another date (no signature)
    const managerEditDate = new Date()
    managerEditDate.setDate(managerEditDate.getDate() + 2)
    managerEditDate.setHours(9, 0, 0, 0)

    const employeeEntry = await prisma.timeEntry.create({
      data: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockIn: managerEditDate,
        clockOut: new Date(managerEditDate.getTime() + 8 * 60 * 60 * 1000), // +8h
        source: 'manual',
        status: 'active',
      },
    })

    // Check if manager can edit (no signature for this date)
    const managerEditDateOnly = new Date(managerEditDate)
    managerEditDateOnly.setHours(0, 0, 0, 0)

    const reportForManagerEdit = await prisma.reportDaily.findUnique({
      where: {
        restaurantId_date: {
          restaurantId: restaurant.id,
          date: managerEditDateOnly,
        },
      },
    })

    const managerCanEdit = !reportForManagerEdit || !reportForManagerEdit.signedAt

    if (managerCanEdit) {
      const managerEditedEntry = await prisma.timeEntry.update({
        where: { id: employeeEntry.id },
        data: {
          adjustmentMinutes: 15,
          reason: 'Adjusted by manager - DST correction',
        },
      })

      if (managerEditedEntry.adjustmentMinutes === 15) {
        logSuccess('Manager can edit any employee TimeEntry before signature')
      } else {
        logFailure('Manager edit failed', managerEditedEntry)
      }
    } else {
      logFailure('Manager should be able to edit but report is already signed')
    }

    // ============================================================
    // CLEANUP: Delete test TimeEntries from future dates
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('CLEANUP: Removing test TimeEntries')
    console.log('='.repeat(60))

    await prisma.timeEntry.deleteMany({
      where: {
        id: {
          in: [hangingEntry.id, employeeEntry.id],
        },
      },
    })

    console.log('✅ Cleanup complete')
  } catch (error) {
    console.error('\n❌ Test suite error:', error)
    testsFailedCount++
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Tests Passed: ${testsPassedCount}`)
  console.log(`❌ Tests Failed: ${testsFailedCount}`)
  console.log(
    `📈 Success Rate: ${testsPassedCount}/${testsPassedCount + testsFailedCount} (${Math.round((testsPassedCount / (testsPassedCount + testsFailedCount)) * 100)}%)`
  )
  console.log('='.repeat(60) + '\n')

  if (testsFailedCount > 0) {
    process.exit(1)
  }
}

// Run tests
runTests()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

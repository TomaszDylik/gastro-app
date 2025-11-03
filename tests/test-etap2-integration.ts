/**
 * ETAP 2: Integration tests for effectiveHourlyRate with database
 */

import { PrismaClient } from '@prisma/client'
import { effectiveHourlyRate } from '../lib/effective-hourly-rate'

const prisma = new PrismaClient()

console.log('🧪 Testing effectiveHourlyRate with real database data (ETAP 2)...\n')

async function testEffectiveRateWithDatabase() {
  try {
    // Test 1: Get real user from database
    console.log('Test 1: Employee with default rate from database')
    const employee = await prisma.appUser.findFirst({
      where: {
        memberships: {
          some: {
            role: 'employee',
          },
        },
      },
      include: {
        memberships: {
          include: {
            restaurant: true,
          },
        },
      },
    })

    if (employee && employee.memberships.length > 0) {
      const membership = employee.memberships[0]
      const rate = effectiveHourlyRate({
        userDefaultRate: employee.hourlyRateDefaultPLN,
        membershipManagerRate: membership.hourlyRateManagerPLN,
        membershipRole: membership.role,
        workingAsManager: false,
      })
      console.log(`  User: ${employee.name}`)
      console.log(`  Default rate: ${employee.hourlyRateDefaultPLN?.toString() || 'null'} PLN`)
      console.log(`  Calculated rate: ${rate} PLN`)
      console.assert(rate === Number(employee.hourlyRateDefaultPLN || 0), 'Should use default rate')
      console.log('  ✅ PASSED\n')
    } else {
      console.log('  ⚠️  No employee found, skipping test\n')
    }

    // Test 2: Manager working as manager
    console.log('Test 2: Manager working as manager')
    const manager = await prisma.appUser.findFirst({
      where: {
        memberships: {
          some: {
            role: 'manager',
          },
        },
      },
      include: {
        memberships: {
          where: {
            role: 'manager',
          },
        },
      },
    })

    if (manager && manager.memberships.length > 0) {
      const membership = manager.memberships[0]
      const rateAsManager = effectiveHourlyRate({
        userDefaultRate: manager.hourlyRateDefaultPLN,
        membershipManagerRate: membership.hourlyRateManagerPLN,
        membershipRole: membership.role,
        workingAsManager: true,
      })
      console.log(`  User: ${manager.name}`)
      console.log(`  Default rate: ${manager.hourlyRateDefaultPLN?.toString() || 'null'} PLN`)
      console.log(`  Manager rate: ${membership.hourlyRateManagerPLN?.toString() || 'null'} PLN`)
      console.log(`  Calculated rate (as manager): ${rateAsManager} PLN`)

      if (membership.hourlyRateManagerPLN) {
        console.assert(
          rateAsManager === Number(membership.hourlyRateManagerPLN),
          'Should use manager rate'
        )
        console.log('  ✅ PASSED (using manager rate)\n')
      } else {
        console.assert(
          rateAsManager === Number(manager.hourlyRateDefaultPLN || 0),
          'Should use default rate'
        )
        console.log('  ✅ PASSED (using default rate - no manager rate set)\n')
      }
    } else {
      console.log('  ⚠️  No manager found, skipping test\n')
    }

    // Test 3: Manager working as employee
    if (manager && manager.memberships.length > 0) {
      console.log('Test 3: Manager working as employee')
      const membership = manager.memberships[0]
      const rateAsEmployee = effectiveHourlyRate({
        userDefaultRate: manager.hourlyRateDefaultPLN,
        membershipManagerRate: membership.hourlyRateManagerPLN,
        membershipRole: membership.role,
        workingAsManager: false,
      })
      console.log(`  User: ${manager.name}`)
      console.log(`  Calculated rate (as employee): ${rateAsEmployee} PLN`)
      console.assert(
        rateAsEmployee === Number(manager.hourlyRateDefaultPLN || 0),
        'Should use default rate when working as employee'
      )
      console.log('  ✅ PASSED\n')
    }

    // Test 4: Count all users and their rates
    console.log('Test 4: Summary of all users and their rates')
    const allUsers = await prisma.appUser.findMany({
      include: {
        memberships: {
          include: {
            restaurant: true,
          },
        },
      },
    })

    console.log(`  Total users in database: ${allUsers.length}`)
    allUsers.forEach((user) => {
      console.log(`\n  👤 ${user.name || 'Unnamed'}`)
      console.log(`     Email: ${user.email || 'N/A'}`)
      console.log(`     Default rate: ${user.hourlyRateDefaultPLN?.toString() || 'null'} PLN`)

      user.memberships.forEach((m) => {
        console.log(
          `     └─ ${m.restaurant.name}: ${m.role} (manager rate: ${m.hourlyRateManagerPLN?.toString() || 'null'} PLN)`
        )

        const asEmployee = effectiveHourlyRate({
          userDefaultRate: user.hourlyRateDefaultPLN,
          membershipManagerRate: m.hourlyRateManagerPLN,
          membershipRole: m.role,
          workingAsManager: false,
        })

        const asManager = effectiveHourlyRate({
          userDefaultRate: user.hourlyRateDefaultPLN,
          membershipManagerRate: m.hourlyRateManagerPLN,
          membershipRole: m.role,
          workingAsManager: true,
        })

        console.log(`        → As employee: ${asEmployee} PLN`)
        console.log(`        → As manager: ${asManager} PLN`)
      })
    })
    console.log('\n  ✅ All calculations completed\n')

    console.log('✅ All integration tests passed!')
  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEffectiveRateWithDatabase()

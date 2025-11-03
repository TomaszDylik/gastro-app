/**
 * ETAP 10: AuditLog Tests (Unit Tests)
 * Tests audit logging helper functions
 */

import { PrismaClient } from '@prisma/client'
import { createAuditLog, getAuditLogs, canAccessAuditLogs } from '../lib/audit'

const prisma = new PrismaClient()

console.log('🧪 ETAP 10: AuditLog Unit Tests\n')

let testsPassed = 0
let testsFailed = 0

/**
 * Test 1: canAccessAuditLogs - only admin and owner
 */
async function test1_CanAccessAuditLogs() {
  try {
    console.log('Test 1: Check audit log permissions...')

    const adminCan = canAccessAuditLogs('super_admin')
    const ownerCan = canAccessAuditLogs('owner')
    const managerCannot = canAccessAuditLogs('manager')
    const employeeCannot = canAccessAuditLogs('employee')

    if (adminCan && ownerCan && !managerCannot && !employeeCannot) {
      console.log('✅ Permissions correct: admin/owner can, manager/employee cannot\n')
      testsPassed++
    } else {
      throw new Error('Permission check failed')
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 2: Create audit log entry
 */
async function test2_CreateAuditLog() {
  try {
    console.log('Test 2: Creating audit log entry...')

    // Get first user for test
    const user = await prisma.appUser.findFirst()
    if (!user) throw new Error('No user found')

    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) throw new Error('No restaurant found')

    const auditLog = await createAuditLog({
      actorUserId: user.id,
      restaurantId: restaurant.id,
      entityType: 'TestEntity',
      entityId: 'test-123',
      action: 'time_entry.edit',
      before: { value: 'old' },
      after: { value: 'new' },
    })

    if (auditLog) {
      console.log('✅ Audit log created:')
      console.log(`   ID: ${auditLog.id}`)
      console.log(`   Action: ${auditLog.action}`)
      console.log(`   EntityType: ${auditLog.entityType}\n`)

      // Cleanup
      await prisma.auditLog.delete({ where: { id: auditLog.id } })
      testsPassed++
    } else {
      throw new Error('Audit log creation returned null')
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 3: Get audit logs
 */
async function test3_GetAuditLogs() {
  try {
    console.log('Test 3: Retrieving audit logs...')

    const result = await getAuditLogs({
      limit: 5,
      offset: 0,
    })

    if (result && typeof result.total === 'number') {
      console.log('✅ Retrieved audit logs:')
      console.log(`   Total: ${result.total}`)
      console.log(`   Returned: ${result.logs.length}`)
      if (result.logs.length > 0) {
        console.log(`   Latest action: ${result.logs[0].action}\n`)
      } else {
        console.log('   (no logs yet)\n')
      }
      testsPassed++
    } else {
      throw new Error('Invalid audit logs response')
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 4: Filter audit logs by restaurant
 */
async function test4_FilterByRestaurant() {
  try {
    console.log('Test 4: Filtering audit logs by restaurant...')

    const restaurant = await prisma.restaurant.findFirst()
    if (!restaurant) throw new Error('No restaurant found')

    const result = await getAuditLogs({
      restaurantId: restaurant.id,
      limit: 10,
    })

    // All returned logs should be for this restaurant or null
    const allMatch = result.logs.every(
      (log) => log.restaurantId === restaurant.id || log.restaurantId === null
    )

    if (allMatch) {
      console.log('✅ Filtered correctly by restaurant:')
      console.log(`   Restaurant: ${restaurant.name}`)
      console.log(`   Logs: ${result.logs.length}\n`)
      testsPassed++
    } else {
      throw new Error('Filter did not work correctly')
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 5: Audit log includes actor information
 */
async function test5_AuditLogIncludesActor() {
  try {
    console.log('Test 5: Audit log includes actor info...')

    const user = await prisma.appUser.findFirst()
    if (!user) throw new Error('No user found')

    const auditLog = await createAuditLog({
      actorUserId: user.id,
      entityType: 'TestEntity',
      entityId: 'test-456',
      action: 'time_entry.create',
      after: { test: true },
    })

    if (!auditLog) throw new Error('Audit log not created')

    // Retrieve with actor info
    const retrieved = await prisma.auditLog.findUnique({
      where: { id: auditLog.id },
      include: { actor: true },
    })

    if (retrieved && retrieved.actor.id === user.id) {
      console.log('✅ Actor information included:')
      console.log(`   Actor: ${retrieved.actor.name}`)
      console.log(`   Actor ID: ${retrieved.actor.id}\n`)

      // Cleanup
      await prisma.auditLog.delete({ where: { id: auditLog.id } })
      testsPassed++
    } else {
      throw new Error('Actor info not included')
    }
  } catch (error) {
    console.log(`❌ Failed: ${error}\n`)
    testsFailed++
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting ETAP 10 AuditLog Unit Tests...\n')

  await test1_CanAccessAuditLogs()
  await test2_CreateAuditLog()
  await test3_GetAuditLogs()
  await test4_FilterByRestaurant()
  await test5_AuditLogIncludesActor()

  console.log('─'.repeat(50))
  console.log(`✅ Tests Passed: ${testsPassed}`)
  console.log(`❌ Tests Failed: ${testsFailed}`)
  console.log(
    `📈 Success Rate: ${testsPassed}/${testsPassed + testsFailed} (${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%)`
  )

  await prisma.$disconnect()
  process.exit(testsFailed > 0 ? 1 : 0)
}

runTests()

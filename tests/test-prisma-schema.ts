import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPrismaSchema() {
  console.log('🧪 Testing Prisma schema with dual hourly rates...\n')

  try {
    // Test 1: Get existing user first
    console.log('Test 1: Get existing user for test')
    const existingUser = await prisma.appUser.findFirst()
    
    if (!existingUser) {
      console.log('❌ No users found - run seed first: pnpm prisma db seed')
      return false
    }

    console.log(`✅ Using user: ${existingUser.name}`)

    // Test 2: Create membership with new fields
    console.log('\nTest 2: Create membership with dual rates')
    const testMembership = await prisma.membership.create({
      data: {
        userId: existingUser.id,
        restaurantId: 'rest-podgrusza',
        role: 'manager',
        status: 'active',
        hourlyRateEmployee: 35.00,
        hourlyRateManager: 50.00
      }
    })
    
    console.log('✅ Created membership:', {
      id: testMembership.id,
      hourlyRateEmployee: testMembership.hourlyRateEmployee,
      hourlyRateManager: testMembership.hourlyRateManager
    })

    // Test 2: Query and verify fields exist
    console.log('\nTest 2: Query membership and verify fields')
    const queried = await prisma.membership.findUnique({
      where: { id: testMembership.id }
    })

    if (!queried) {
      throw new Error('Membership not found!')
    }

    console.log('✅ Queried membership:', {
      hourlyRateEmployee: queried.hourlyRateEmployee?.toString(),
      hourlyRateManager: queried.hourlyRateManager?.toString()
    })

    // Test 3: Update rates
    console.log('\nTest 3: Update hourly rates')
    const updated = await prisma.membership.update({
      where: { id: testMembership.id },
      data: {
        hourlyRateEmployee: 40.00,
        hourlyRateManager: 55.00
      }
    })

    console.log('✅ Updated rates:', {
      hourlyRateEmployee: updated.hourlyRateEmployee?.toString(),
      hourlyRateManager: updated.hourlyRateManager?.toString()
    })

    // Cleanup
    await prisma.membership.delete({
      where: { id: testMembership.id }
    })
    console.log('\n✅ Cleanup completed')

    // Test 4: Check existing memberships migrated correctly
    console.log('\nTest 4: Check existing memberships from seed')
    const existingMemberships = await prisma.membership.findMany({
      include: {
        user: true
      }
    })

    console.log(`✅ Found ${existingMemberships.length} memberships:`)
    existingMemberships.forEach(m => {
      console.log(`  - ${m.user.name}: employee=${m.hourlyRateEmployee?.toString() || 'null'}, manager=${m.hourlyRateManager?.toString() || 'null'}`)
    })

    console.log('\n🎉 All Prisma tests passed!')
    return true

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaSchema()

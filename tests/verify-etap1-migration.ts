/**
 * ETAP 2: Verification test - Check if database migration was successful
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log('🔍 Verifying ETAP 1 database migration...\n')

  try {
    // Check if AppUser has new columns
    const user = await prisma.appUser.findFirst()
    console.log('AppUser sample:')
    console.log('  ID:', user?.id)
    console.log('  Name:', user?.name)
    console.log('  Has email field?', 'email' in (user || {}))
    console.log('  Has hourlyRateDefaultPLN field?', 'hourlyRateDefaultPLN' in (user || {}))
    console.log()

    // Check if Membership has new column
    const membership = await prisma.membership.findFirst()
    console.log('Membership sample:')
    console.log('  ID:', membership?.id)
    console.log('  Role:', membership?.role)
    console.log('  Has hourlyRateManagerPLN field?', 'hourlyRateManagerPLN' in (membership || {}))
    console.log()

    // Check if Company table exists
    try {
      const companyCount = await prisma.company.count()
      console.log('✅ Company table exists')
      console.log('  Count:', companyCount)
    } catch (e) {
      console.log('❌ Company table does NOT exist')
    }
    console.log()

    // Check if ReportDaily table exists
    try {
      const reportCount = await prisma.reportDaily.count()
      console.log('✅ ReportDaily table exists')
      console.log('  Count:', reportCount)
    } catch (e) {
      console.log('❌ ReportDaily table does NOT exist')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()

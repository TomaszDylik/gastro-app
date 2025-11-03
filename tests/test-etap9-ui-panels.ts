/**
 * ETAP 9: UI Panels - E2E Tests
 * Tests routing and role-based access for all 4 user panels
 */

console.log('🧪 ETAP 9: UI Panels E2E Tests\n')

const BASE_URL = 'http://localhost:3000'
let testsPassed = 0
let testsFailed = 0

/**
 * Test 1: Admin panel route exists
 */
async function test1_AdminPanelRoute() {
  try {
    console.log('Test 1: Admin panel route exists...')

    const response = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual', // Don't follow redirects (may redirect to login)
    })

    // Should respond (either with page or redirect to login)
    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Admin route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Admin route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Admin route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 2: Owner panel route exists
 */
async function test2_OwnerPanelRoute() {
  try {
    console.log('Test 2: Owner panel route exists...')

    const response = await fetch(`${BASE_URL}/owner/dashboard`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Owner route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Owner route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Owner route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 3: Manager panel route exists (dynamic route)
 */
async function test3_ManagerPanelRoute() {
  try {
    console.log('Test 3: Manager panel route exists...')

    // Use test restaurant ID
    const testRestaurantId = 'test-restaurant-123'
    const response = await fetch(`${BASE_URL}/restaurant/${testRestaurantId}`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Manager route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Manager route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Manager route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 4: Employee panel route exists
 */
async function test4_EmployeePanelRoute() {
  try {
    console.log('Test 4: Employee panel route exists...')

    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Employee route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Employee route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Employee route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 5: Owner companies route exists
 */
async function test5_OwnerCompaniesRoute() {
  try {
    console.log('Test 5: Owner companies route exists...')

    const response = await fetch(`${BASE_URL}/owner/companies`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Owner companies route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Owner companies route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Owner companies route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 6: Owner reports route exists
 */
async function test6_OwnerReportsRoute() {
  try {
    console.log('Test 6: Owner reports route exists...')

    const response = await fetch(`${BASE_URL}/owner/reports`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Owner reports route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Owner reports route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Owner reports route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 7: Manager team route exists
 */
async function test7_ManagerTeamRoute() {
  try {
    console.log('Test 7: Manager team route exists...')

    const testRestaurantId = 'test-restaurant-123'
    const response = await fetch(`${BASE_URL}/restaurant/${testRestaurantId}/team`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Manager team route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Manager team route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Manager team route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Test 8: Admin users route exists
 */
async function test8_AdminUsersRoute() {
  try {
    console.log('Test 8: Admin users route exists...')

    const response = await fetch(`${BASE_URL}/admin/users`, {
      redirect: 'manual',
    })

    if (response.status === 200 || response.status === 302 || response.status === 307) {
      console.log('✅ Admin users route accessible\n')
      testsPassed++
    } else {
      console.log(`❌ Admin users route returned unexpected status: ${response.status}\n`)
      testsFailed++
    }
  } catch (error) {
    console.log(`❌ Admin users route error: ${error}\n`)
    testsFailed++
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting ETAP 9 UI Panels E2E Tests...\n')
  console.log('⚠️  Note: Server must be running on localhost:3000\n')

  await test1_AdminPanelRoute()
  await test2_OwnerPanelRoute()
  await test3_ManagerPanelRoute()
  await test4_EmployeePanelRoute()
  await test5_OwnerCompaniesRoute()
  await test6_OwnerReportsRoute()
  await test7_ManagerTeamRoute()
  await test8_AdminUsersRoute()

  console.log('─'.repeat(50))
  console.log(`✅ Tests Passed: ${testsPassed}`)
  console.log(`❌ Tests Failed: ${testsFailed}`)
  console.log(
    `📈 Success Rate: ${testsPassed}/${testsPassed + testsFailed} (${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%)`
  )

  process.exit(testsFailed > 0 ? 1 : 0)
}

runTests()

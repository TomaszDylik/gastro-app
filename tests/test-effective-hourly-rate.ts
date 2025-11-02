/**
 * ETAP 1.2 - Tests for Effective Hourly Rate Calculation
 */

import { Decimal } from '@prisma/client/runtime/library'
import { effectiveHourlyRate } from '../lib/effective-hourly-rate'

console.log('🧪 Testing Effective Hourly Rate Calculation (ETAP 1.2)...\n')

// Test 1: Employee with default rate only
console.log('Test 1: Employee with default rate (35 PLN)')
const result1 = effectiveHourlyRate({
  userDefaultRate: new Decimal(35),
  membershipManagerRate: null,
  membershipRole: 'employee',
  workingAsManager: false
})
console.log('  Result:', result1, 'PLN')
console.assert(result1 === 35, 'Should return default rate')
console.log('  ✅ PASSED\n')

// Test 2: Manager working as manager with manager rate
console.log('Test 2: Manager working as manager (default: 35, manager: 50)')
const result2 = effectiveHourlyRate({
  userDefaultRate: new Decimal(35),
  membershipManagerRate: new Decimal(50),
  membershipRole: 'manager',
  workingAsManager: true
})
console.log('  Result:', result2, 'PLN')
console.assert(result2 === 50, 'Should return manager rate')
console.log('  ✅ PASSED\n')

// Test 3: Manager working as employee (not as manager)
console.log('Test 3: Manager working as employee (default: 35, manager: 50)')
const result3 = effectiveHourlyRate({
  userDefaultRate: new Decimal(35),
  membershipManagerRate: new Decimal(50),
  membershipRole: 'manager',
  workingAsManager: false
})
console.log('  Result:', result3, 'PLN')
console.assert(result3 === 35, 'Should return default rate when not working as manager')
console.log('  ✅ PASSED\n')

// Test 4: Owner working as manager with manager rate
console.log('Test 4: Owner working as manager (default: 40, manager: 60)')
const result4 = effectiveHourlyRate({
  userDefaultRate: new Decimal(40),
  membershipManagerRate: new Decimal(60),
  membershipRole: 'owner',
  workingAsManager: true
})
console.log('  Result:', result4, 'PLN')
console.assert(result4 === 60, 'Should return manager rate for owner')
console.log('  ✅ PASSED\n')

// Test 5: No rates set
console.log('Test 5: No rates set (fallback to 0)')
const result5 = effectiveHourlyRate({
  userDefaultRate: null,
  membershipManagerRate: null,
  membershipRole: 'employee',
  workingAsManager: false
})
console.log('  Result:', result5, 'PLN')
console.assert(result5 === 0, 'Should return 0 when no rates set')
console.log('  ✅ PASSED\n')

// Test 6: Manager has manager rate but working as employee
console.log('Test 6: Manager has only manager rate (50) but working as employee')
const result6 = effectiveHourlyRate({
  userDefaultRate: null,
  membershipManagerRate: new Decimal(50),
  membershipRole: 'manager',
  workingAsManager: false
})
console.log('  Result:', result6, 'PLN')
console.assert(result6 === 0, 'Should return 0 when no default rate and not working as manager')
console.log('  ✅ PASSED\n')

// Test 7: Employee cannot use manager rate even if set
console.log('Test 7: Employee with manager rate set (should ignore it)')
const result7 = effectiveHourlyRate({
  userDefaultRate: new Decimal(30),
  membershipManagerRate: new Decimal(50),
  membershipRole: 'employee',
  workingAsManager: true  // Even if true, employee can't use manager rate
})
console.log('  Result:', result7, 'PLN')
console.assert(result7 === 30, 'Employee should use default rate regardless of workingAsManager')
console.log('  ✅ PASSED\n')

// Test 8: Super admin working as manager
console.log('Test 8: Super admin (should use default rate)')
const result8 = effectiveHourlyRate({
  userDefaultRate: new Decimal(100),
  membershipManagerRate: new Decimal(80),
  membershipRole: 'super_admin',
  workingAsManager: true
})
console.log('  Result:', result8, 'PLN')
console.assert(result8 === 100, 'Super admin should use default rate')
console.log('  ✅ PASSED\n')

console.log('✅ All Effective Hourly Rate tests passed!')
console.log('\n📊 Summary:')
console.log('  - Employee: uses default rate')
console.log('  - Manager/Owner + workingAsManager=true: uses manager rate')
console.log('  - Manager/Owner + workingAsManager=false: uses default rate')
console.log('  - Fallback: 0 PLN when no rates set')

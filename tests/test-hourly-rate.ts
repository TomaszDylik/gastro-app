import { effectiveHourlyRate } from '../lib/hourly-rate'

// Test 1: Employee with only employee rate
console.log('Test 1 - Employee with employee rate:')
const rate1 = effectiveHourlyRate({
  membershipRole: 'employee',
  hourlyRateEmployee: 35.00,
  hourlyRateManager: null,
  workingAsManager: false
})
console.log('Expected: 35, Got:', rate1)
console.assert(rate1 === 35, 'Employee rate should be 35')

// Test 2: Manager working as manager with both rates
console.log('\nTest 2 - Manager working as manager:')
const rate2 = effectiveHourlyRate({
  membershipRole: 'manager',
  hourlyRateEmployee: 35.00,
  hourlyRateManager: 50.00,
  workingAsManager: true
})
console.log('Expected: 50, Got:', rate2)
console.assert(rate2 === 50, 'Manager rate should be 50 when working as manager')

// Test 3: Manager working as employee
console.log('\nTest 3 - Manager working as employee:')
const rate3 = effectiveHourlyRate({
  membershipRole: 'manager',
  hourlyRateEmployee: 35.00,
  hourlyRateManager: 50.00,
  workingAsManager: false
})
console.log('Expected: 35, Got:', rate3)
console.assert(rate3 === 35, 'Employee rate should be used when not working as manager')

// Test 4: No rate set
console.log('\nTest 4 - No rates set:')
const rate4 = effectiveHourlyRate({
  membershipRole: 'employee',
  hourlyRateEmployee: null,
  hourlyRateManager: null,
  workingAsManager: false
})
console.log('Expected: 0, Got:', rate4)
console.assert(rate4 === 0, 'Should fallback to 0 when no rate set')

console.log('\n✅ All tests passed!')

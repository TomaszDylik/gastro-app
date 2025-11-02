/**
 * ETAP 1.2 - Effective Hourly Rate Calculation
 * 
 * Calculates the effective hourly rate based on:
 * - User's default rate (hourlyRateDefaultPLN)
 * - Membership manager rate (hourlyRateManagerPLN)
 * - Role and working mode
 */

import { Decimal } from '@prisma/client/runtime/library'

export interface EffectiveRateParams {
  userDefaultRate?: Decimal | null
  membershipManagerRate?: Decimal | null
  membershipRole: 'super_admin' | 'owner' | 'manager' | 'employee'
  workingAsManager?: boolean
}

/**
 * Calculate effective hourly rate for a user
 * 
 * Priority:
 * 1. If working as manager AND has manager rate → use manager rate
 * 2. Otherwise use user's default rate
 * 3. Fallback to 0
 * 
 * @param params - Rate calculation parameters
 * @returns Effective hourly rate in PLN
 */
export function effectiveHourlyRate(params: EffectiveRateParams): number {
  const {
    userDefaultRate,
    membershipManagerRate,
    membershipRole,
    workingAsManager = false
  } = params

  // If working as manager and has manager rate, use it
  if (
    workingAsManager &&
    (membershipRole === 'manager' || membershipRole === 'owner') &&
    membershipManagerRate !== null &&
    membershipManagerRate !== undefined
  ) {
    return Number(membershipManagerRate)
  }

  // Otherwise use user's default rate
  if (userDefaultRate !== null && userDefaultRate !== undefined) {
    return Number(userDefaultRate)
  }

  // Fallback to 0
  return 0
}

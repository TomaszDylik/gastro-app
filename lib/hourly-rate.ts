/**
 * Calculate effective hourly rate based on membership role and current context
 * 
 * Rules:
 * - If user has manager role AND hourlyRateManager is set, use it when working manager shifts
 * - Otherwise use hourlyRateEmployee
 * - Fall back to 0 if no rate is set
 */

interface HourlyRateParams {
  membershipRole: 'employee' | 'manager' | 'super_admin'
  hourlyRateEmployee: number | null
  hourlyRateManager: number | null
  workingAsManager?: boolean // Is this shift a manager shift?
}

export function effectiveHourlyRate(params: HourlyRateParams): number {
  const { 
    membershipRole, 
    hourlyRateEmployee, 
    hourlyRateManager, 
    workingAsManager = false 
  } = params

  // If working as manager and has manager rate, use it
  if (workingAsManager && membershipRole === 'manager' && hourlyRateManager !== null) {
    return Number(hourlyRateManager)
  }

  // Otherwise use employee rate
  if (hourlyRateEmployee !== null) {
    return Number(hourlyRateEmployee)
  }

  // Fallback to 0 if no rate set
  return 0
}

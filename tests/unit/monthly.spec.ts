import { describe, it, expect } from 'vitest'
import { toMonthKey } from '@/lib/dates'

describe('toMonthKey', () => {
  it('formats YYYY-MM', () => {
    const d = new Date('2025-03-15T10:00:00Z')
    expect(toMonthKey(d)).toBe('2025-03')
  })
})

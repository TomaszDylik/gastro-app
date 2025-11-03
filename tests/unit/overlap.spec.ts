import { describe, it, expect } from 'vitest'

type Interval = { start: Date; end: Date }
function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end
}

describe('overlap validation', () => {
  it('detects overlap', () => {
    const a = { start: new Date('2025-01-01T08:00:00Z'), end: new Date('2025-01-01T12:00:00Z') }
    const b = { start: new Date('2025-01-01T11:00:00Z'), end: new Date('2025-01-01T13:00:00Z') }
    expect(overlaps(a, b)).toBe(true)
  })
})

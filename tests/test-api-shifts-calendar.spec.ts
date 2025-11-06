/**
 * API Test: /api/shifts (GET)
 * 
 * Tests for calendar shifts endpoint including:
 * - Monthly shift assignments retrieval
 * - Status filtering (confirmed, pending, declined)
 * - Planned hours calculation
 * - Date formatting and transformations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { isServerRunning } from './helpers/server-check'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe.skipIf(!(await isServerRunning()))('API: GET /api/shifts', () => {
  let testUserId: string
  let testRestaurantId: string
  let testMembershipId: string
  let testScheduleId: string

  beforeAll(async () => {
    // Create test data
    const user = await prisma.appUser.create({
      data: {
        authUserId: `test-shifts-${Date.now()}`,
        name: 'Test Shifts User',
        email: 'shifts@test.com',
      },
    })
    testUserId = user.id

    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Shifts Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })
    testRestaurantId = restaurant.id

    const membership = await prisma.membership.create({
      data: {
        userId: testUserId,
        restaurantId: testRestaurantId,
        role: 'employee',
        status: 'active',
      },
    })
    testMembershipId = membership.id

    const schedule = await prisma.schedule.create({
      data: {
        restaurantId: testRestaurantId,
        name: 'Test Week Nov 2025',
        isActive: true,
      },
    })
    testScheduleId = schedule.id

    // Create shifts for November 2025
    const shifts = [
      {
        scheduleId: testScheduleId,
        start: new Date('2025-11-03T08:00:00Z'),
        end: new Date('2025-11-03T16:00:00Z'),
        roleTag: 'Kelner',
      },
      {
        scheduleId: testScheduleId,
        start: new Date('2025-11-04T10:00:00Z'),
        end: new Date('2025-11-04T18:00:00Z'),
        roleTag: 'Kucharz',
      },
      {
        scheduleId: testScheduleId,
        start: new Date('2025-11-05T14:00:00Z'),
        end: new Date('2025-11-05T22:00:00Z'),
        roleTag: 'Barman',
      },
    ]

    const createdShifts = await Promise.all(
      shifts.map(shift => prisma.shift.create({ data: shift }))
    )

    // Create shift assignments with different statuses
    await prisma.shiftAssignment.create({
      data: {
        shiftId: createdShifts[0].id,
        membershipId: testMembershipId,
        status: 'assigned',
      },
    })

    await prisma.shiftAssignment.create({
      data: {
        shiftId: createdShifts[1].id,
        membershipId: testMembershipId,
        status: 'assigned',
      },
    })

    await prisma.shiftAssignment.create({
      data: {
        shiftId: createdShifts[2].id,
        membershipId: testMembershipId,
        status: 'declined',
      },
    })
  })

  afterAll(async () => {
    // Cleanup in correct order
    if (testMembershipId) {
      await prisma.shiftAssignment.deleteMany({ where: { membershipId: testMembershipId } })
    }
    if (testScheduleId) {
      await prisma.shift.deleteMany({ where: { scheduleId: testScheduleId } })
      await prisma.schedule.delete({ where: { id: testScheduleId } })
    }
    if (testMembershipId) {
      await prisma.membership.delete({ where: { id: testMembershipId } })
    }
    if (testRestaurantId) {
      await prisma.restaurant.delete({ where: { id: testRestaurantId } })
    }
    if (testUserId) {
      await prisma.appUser.delete({ where: { id: testUserId } })
    }
    await prisma.$disconnect()
  })

  it('should return shifts for given month and membership', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.shifts).toBeDefined()
    expect(Array.isArray(data.shifts)).toBe(true)
    expect(data.shifts.length).toBe(3)

    expect(data.stats).toBeDefined()
    expect(data.stats.total).toBe(3)
    expect(data.stats.confirmed).toBeGreaterThan(0) // assigned or completed
    expect(data.stats.pending).toBeGreaterThan(0) // assigned
    expect(data.stats.declined).toBeGreaterThan(0)
    expect(data.stats.plannedHours).toBeGreaterThan(0)
  })

  it('should format shift times correctly', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    const shift = data.shifts[0]
    expect(shift).toHaveProperty('date')
    expect(shift).toHaveProperty('start')
    expect(shift).toHaveProperty('end')
    expect(shift).toHaveProperty('role')
    expect(shift).toHaveProperty('status')

    // Verify date format (YYYY-MM-DD)
    expect(shift.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Verify time format (HH:mm)
    expect(shift.start).toMatch(/^\d{2}:\d{2}$/)
    expect(shift.end).toMatch(/^\d{2}:\d{2}$/)
  })

  it('should calculate planned hours correctly', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    // Each shift is 8 hours, 3 shifts total = 24 hours
    expect(data.stats.plannedHours).toBe(24)
  })

  it('should filter by status', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    const assignedShifts = data.shifts.filter((s: any) => s.status === 'assigned')
    const declinedShifts = data.shifts.filter((s: any) => s.status === 'declined')

    expect(assignedShifts.length).toBe(2)
    expect(declinedShifts.length).toBe(1)
  })

  it('should return empty array for month with no shifts', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-12`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.shifts).toEqual([])
    expect(data.stats.total).toBe(0)
    expect(data.stats.confirmed).toBe(0)
    expect(data.stats.pending).toBe(0)
    expect(data.stats.declined).toBe(0)
    expect(data.stats.plannedHours).toBe(0)
  })

  it('should default to current month if month not provided', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.shifts).toBeDefined()
    expect(data.stats).toBeDefined()
  })

  it('should require membershipId', async () => {
    const response = await fetch(`${API_BASE}/api/shifts?month=2025-11`)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('membershipId')
  })

  it('should validate membershipId existence', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=non-existent-id&month=2025-11`
    )

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Membership not found')
  })

  it('should include role information in shifts', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    const roles = data.shifts.map((s: any) => s.role)
    expect(roles.some((r: string) => r === 'Kelner' || r.includes('Test Week'))).toBe(true)
  })

  it('should sort shifts by date ascending', async () => {
    const response = await fetch(
      `${API_BASE}/api/shifts?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    const dates = data.shifts.map((s: any) => s.date)
    const sortedDates = [...dates].sort()
    
    expect(dates).toEqual(sortedDates)
  })
})

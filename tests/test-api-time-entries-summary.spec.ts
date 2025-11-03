/**
 * API Test: /api/time-entries/summary
 * 
 * Tests for monthly summary endpoint including:
 * - Total hours calculation
 * - Weekly breakdown
 * - Recent entries
 * - Earnings calculation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('API: /api/time-entries/summary', () => {
  let testUserId: string
  let testRestaurantId: string
  let testMembershipId: string
  let testScheduleId: string

  beforeAll(async () => {
    // Create test data
    const user = await prisma.appUser.create({
      data: {
        authUserId: `test-summary-${Date.now()}`,
        name: 'Test Summary User',
        email: 'summary@test.com',
        hourlyRateDefaultPLN: 35.00,
      },
    })
    testUserId = user.id

    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Summary Restaurant',
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
        name: 'Test Schedule',
        isActive: true,
      },
    })
    testScheduleId = schedule.id

    // Create some time entries for November 2025
    const entries = [
      // Week 1 - all approved
      {
        clockIn: new Date('2025-11-03T09:00:00Z'),
        clockOut: new Date('2025-11-03T17:30:00Z'), // 8.5h
        status: 'approved' as const,
      },
      {
        clockIn: new Date('2025-11-04T09:15:00Z'),
        clockOut: new Date('2025-11-04T17:45:00Z'), // 8.5h
        status: 'approved' as const,
      },
      {
        clockIn: new Date('2025-11-05T09:00:00Z'),
        clockOut: new Date('2025-11-05T17:00:00Z'), // 8h
        status: 'approved' as const,
      },
      // Week 2 - mixed
      {
        clockIn: new Date('2025-11-10T09:00:00Z'),
        clockOut: new Date('2025-11-10T18:00:00Z'), // 9h
        status: 'approved' as const,
      },
      {
        clockIn: new Date('2025-11-11T09:00:00Z'),
        clockOut: new Date('2025-11-11T17:00:00Z'), // 8h
        status: 'pending' as const,
      },
      {
        clockIn: new Date('2025-11-12T09:00:00Z'),
        clockOut: new Date('2025-11-12T17:30:00Z'), // 8.5h
        status: 'pending' as const,
      },
    ]

    for (const entry of entries) {
      await prisma.timeEntry.create({
        data: {
          membershipId: testMembershipId,
          scheduleId: testScheduleId,
          ...entry,
          source: 'manual',
        },
      })
    }
  })

  afterAll(async () => {
    // Cleanup
    await prisma.timeEntry.deleteMany({
      where: { membershipId: testMembershipId },
    })
    await prisma.schedule.deleteMany({
      where: { id: testScheduleId },
    })
    await prisma.membership.deleteMany({
      where: { id: testMembershipId },
    })
    await prisma.restaurant.deleteMany({
      where: { id: testRestaurantId },
    })
    await prisma.appUser.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  it('should return monthly summary with correct totals', async () => {
    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data).toHaveProperty('summary')
    expect(data.summary.totalHours).toBeCloseTo(50.5, 1) // 8.5+8.5+8+9+8+8.5
    expect(data.summary.approvedHours).toBeCloseTo(34, 1) // 8.5+8.5+8+9
    expect(data.summary.pendingHours).toBeCloseTo(16.5, 1) // 8+8.5
    expect(data.summary.hourlyRate).toBe(35)
    expect(data.summary.approvedEarnings).toBeCloseTo(1190, 1) // 34 * 35
  })

  it('should return weekly breakdown', async () => {
    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data).toHaveProperty('weeklyData')
    expect(Array.isArray(data.weeklyData)).toBe(true)
    expect(data.weeklyData.length).toBeGreaterThan(0)

    // Check first week
    const firstWeek = data.weeklyData[0]
    expect(firstWeek).toHaveProperty('week')
    expect(firstWeek).toHaveProperty('hours')
    expect(firstWeek).toHaveProperty('earnings')
    expect(firstWeek).toHaveProperty('status')
  })

  it('should return recent entries', async () => {
    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data).toHaveProperty('recentEntries')
    expect(Array.isArray(data.recentEntries)).toBe(true)
    expect(data.recentEntries.length).toBeGreaterThan(0)

    const firstEntry = data.recentEntries[0]
    expect(firstEntry).toHaveProperty('date')
    expect(firstEntry).toHaveProperty('clockIn')
    expect(firstEntry).toHaveProperty('clockOut')
    expect(firstEntry).toHaveProperty('hours')
    expect(firstEntry).toHaveProperty('earnings')
    expect(firstEntry).toHaveProperty('status')
  })

  it('should return 400 if membershipId is missing', async () => {
    const response = await fetch(`${API_BASE}/api/time-entries/summary`)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('membershipId is required')
  })

  it('should return 404 if membership not found', async () => {
    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=nonexistent`
    )

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Membership not found')
  })

  it('should default to current month if month param is not provided', async () => {
    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=${testMembershipId}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data).toHaveProperty('month')
    expect(data).toHaveProperty('monthStart')
    expect(data).toHaveProperty('monthEnd')
  })

  it('should handle entries with adjustmentMinutes', async () => {
    // Create an entry with adjustment
    await prisma.timeEntry.create({
      data: {
        membershipId: testMembershipId,
        scheduleId: testScheduleId,
        clockIn: new Date('2025-11-20T09:00:00Z'),
        clockOut: new Date('2025-11-20T17:00:00Z'), // 8h
        adjustmentMinutes: 30, // +0.5h = 8.5h total
        status: 'approved',
        source: 'manual',
      },
    })

    const response = await fetch(
      `${API_BASE}/api/time-entries/summary?membershipId=${testMembershipId}&month=2025-11`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    // Total should include the adjustment
    expect(data.summary.totalHours).toBeGreaterThan(50.5)
  })
})

/**
 * API Test: /api/team
 * 
 * Tests for team management endpoint including:
 * - Team members list retrieval
 * - Statistics calculation (hours, shifts, status)
 * - Filtering by restaurant
 * - Aggregate statistics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('API: GET /api/team', () => {
  let testRestaurantId: string
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string
  let testMembership1Id: string
  let testMembership2Id: string
  let testMembership3Id: string
  let testScheduleId: string

  beforeAll(async () => {
    // Create test restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Team Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })
    testRestaurantId = restaurant.id

    // Create test users
    const user1 = await prisma.appUser.create({
      data: {
        authUserId: `test-team-user1-${Date.now()}`,
        name: 'Alice Johnson',
        email: 'alice@test.com',
        phone: '123456789',
        hourlyRateDefaultPLN: 35.00,
      },
    })
    testUser1Id = user1.id

    const user2 = await prisma.appUser.create({
      data: {
        authUserId: `test-team-user2-${Date.now()}`,
        name: 'Bob Smith',
        email: 'bob@test.com',
        phone: '987654321',
        hourlyRateDefaultPLN: 40.00,
      },
    })
    testUser2Id = user2.id

    const user3 = await prisma.appUser.create({
      data: {
        authUserId: `test-team-user3-${Date.now()}`,
        name: 'Charlie Brown',
        email: 'charlie@test.com',
        hourlyRateDefaultPLN: 30.00,
      },
    })
    testUser3Id = user3.id

    // Create memberships with different statuses
    const membership1 = await prisma.membership.create({
      data: {
        userId: testUser1Id,
        restaurantId: testRestaurantId,
        role: 'employee',
        status: 'active',
        hourlyRateManagerPLN: 45.00,
      },
    })
    testMembership1Id = membership1.id

    const membership2 = await prisma.membership.create({
      data: {
        userId: testUser2Id,
        restaurantId: testRestaurantId,
        role: 'employee',
        status: 'active',
      },
    })
    testMembership2Id = membership2.id

    const membership3 = await prisma.membership.create({
      data: {
        userId: testUser3Id,
        restaurantId: testRestaurantId,
        role: 'employee',
        status: 'pending',
      },
    })
    testMembership3Id = membership3.id

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        restaurantId: testRestaurantId,
        name: 'Test Team Schedule',
        isActive: true,
      },
    })
    testScheduleId = schedule.id

    // Create some shifts and assignments for current month
    const now = new Date()
    const shift1 = await prisma.shift.create({
      data: {
        scheduleId: testScheduleId,
        start: new Date(now.getFullYear(), now.getMonth(), 5, 8, 0),
        end: new Date(now.getFullYear(), now.getMonth(), 5, 16, 0),
        roleTag: 'Waiter',
      },
    })

    const shift2 = await prisma.shift.create({
      data: {
        scheduleId: testScheduleId,
        start: new Date(now.getFullYear(), now.getMonth(), 10, 10, 0),
        end: new Date(now.getFullYear(), now.getMonth(), 10, 18, 0),
        roleTag: 'Cook',
      },
    })

    const shift3 = await prisma.shift.create({
      data: {
        scheduleId: testScheduleId,
        start: new Date(now.getFullYear(), now.getMonth(), 15, 14, 0),
        end: new Date(now.getFullYear(), now.getMonth(), 15, 22, 0),
        roleTag: 'Bartender',
      },
    })

    // Create shift assignments
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift1.id,
        membershipId: testMembership1Id,
        status: 'assigned',
      },
    })

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift2.id,
        membershipId: testMembership1Id,
        status: 'completed',
      },
    })

    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift3.id,
        membershipId: testMembership2Id,
        status: 'assigned',
      },
    })

    // Create time entries for current month
    await prisma.timeEntry.create({
      data: {
        membershipId: testMembership1Id,
        scheduleId: testScheduleId,
        clockIn: new Date(now.getFullYear(), now.getMonth(), 5, 8, 0),
        clockOut: new Date(now.getFullYear(), now.getMonth(), 5, 16, 0),
        status: 'active',
      },
    })

    await prisma.timeEntry.create({
      data: {
        membershipId: testMembership1Id,
        scheduleId: testScheduleId,
        clockIn: new Date(now.getFullYear(), now.getMonth(), 10, 10, 0),
        clockOut: new Date(now.getFullYear(), now.getMonth(), 10, 18, 0),
        status: 'active',
        adjustmentMinutes: 30,
      },
    })

    await prisma.timeEntry.create({
      data: {
        membershipId: testMembership2Id,
        scheduleId: testScheduleId,
        clockIn: new Date(now.getFullYear(), now.getMonth(), 15, 14, 0),
        clockOut: new Date(now.getFullYear(), now.getMonth(), 15, 22, 0),
        status: 'active',
      },
    })
  })

  afterAll(async () => {
    // Cleanup in correct order
    if (testScheduleId) {
      await prisma.timeEntry.deleteMany({ where: { scheduleId: testScheduleId } })
      const shifts = await prisma.shift.findMany({ where: { scheduleId: testScheduleId } })
      for (const shift of shifts) {
        await prisma.shiftAssignment.deleteMany({ where: { shiftId: shift.id } })
      }
      await prisma.shift.deleteMany({ where: { scheduleId: testScheduleId } })
      await prisma.schedule.delete({ where: { id: testScheduleId } })
    }
    if (testMembership1Id) {
      await prisma.membership.delete({ where: { id: testMembership1Id } })
    }
    if (testMembership2Id) {
      await prisma.membership.delete({ where: { id: testMembership2Id } })
    }
    if (testMembership3Id) {
      await prisma.membership.delete({ where: { id: testMembership3Id } })
    }
    if (testRestaurantId) {
      await prisma.restaurant.delete({ where: { id: testRestaurantId } })
    }
    if (testUser1Id) {
      await prisma.appUser.delete({ where: { id: testUser1Id } })
    }
    if (testUser2Id) {
      await prisma.appUser.delete({ where: { id: testUser2Id } })
    }
    if (testUser3Id) {
      await prisma.appUser.delete({ where: { id: testUser3Id } })
    }
    await prisma.$disconnect()
  })

  it('should return team members list with statistics', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.teamMembers).toBeDefined()
    expect(Array.isArray(data.teamMembers)).toBe(true)
    expect(data.teamMembers.length).toBe(3)

    expect(data.stats).toBeDefined()
    expect(data.month).toBeDefined()
  })

  it('should include member details and statistics', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    const alice = data.teamMembers.find((m: any) => m.name === 'Alice Johnson')

    expect(alice).toBeDefined()
    expect(alice.email).toBe('alice@test.com')
    expect(alice.phone).toBe('123456789')
    expect(alice.role).toBe('employee')
    expect(alice.status).toBe('active')
    expect(alice.hourlyRate).toBeDefined()

    expect(alice.stats).toBeDefined()
    expect(alice.stats.totalHours).toBeGreaterThan(0)
    expect(alice.stats.shiftsAssigned).toBeGreaterThan(0)
    expect(alice.stats.shiftsCompleted).toBeGreaterThan(0)
    expect(alice.stats.totalShifts).toBe(2)
    expect(alice.stats.timeEntriesCount).toBe(2)
  })

  it('should calculate hours correctly including adjustments', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    const alice = data.teamMembers.find((m: any) => m.name === 'Alice Johnson')

    // Alice has 2 time entries: 8h + 8h + 30min adjustment = 16.5h
    expect(alice.stats.totalHours).toBe(16.5)
  })

  it('should sort active members first, then by name', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    
    // First two should be active members (Alice and Bob)
    expect(data.teamMembers[0].status).toBe('active')
    expect(data.teamMembers[1].status).toBe('active')
    
    // Third should be pending member (Charlie)
    expect(data.teamMembers[2].status).toBe('pending')
    expect(data.teamMembers[2].name).toBe('Charlie Brown')
  })

  it('should calculate aggregate statistics', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()

    expect(data.stats.totalMembers).toBe(3)
    expect(data.stats.activeMembers).toBe(2)
    expect(data.stats.pendingMembers).toBe(1)
    expect(data.stats.totalHoursThisMonth).toBeGreaterThan(0)
    expect(data.stats.totalShiftsThisMonth).toBeGreaterThan(0)
  })

  it('should filter by restaurant correctly', async () => {
    // Create another restaurant to test filtering
    const otherRestaurant = await prisma.restaurant.create({
      data: {
        name: 'Other Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })

    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    
    // Should only return members from test restaurant
    expect(data.teamMembers.length).toBe(3)
    expect(data.teamMembers.every((m: any) => 
      [testMembership1Id, testMembership2Id, testMembership3Id].includes(m.id)
    )).toBe(true)

    // Cleanup
    await prisma.restaurant.delete({ where: { id: otherRestaurant.id } })
  })

  it('should require restaurantId', async () => {
    const response = await fetch(`${API_BASE}/api/team`)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('restaurantId')
  })

  it('should validate restaurantId existence', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=non-existent-id`
    )

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Restaurant not found')
  })

  it('should return empty list for restaurant with no members', async () => {
    const emptyRestaurant = await prisma.restaurant.create({
      data: {
        name: 'Empty Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })

    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${emptyRestaurant.id}`
    )

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.teamMembers).toEqual([])
    expect(data.stats.totalMembers).toBe(0)
    expect(data.stats.activeMembers).toBe(0)

    // Cleanup
    await prisma.restaurant.delete({ where: { id: emptyRestaurant.id } })
  })

  it('should handle members with no time entries', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    const charlie = data.teamMembers.find((m: any) => m.name === 'Charlie Brown')

    expect(charlie).toBeDefined()
    expect(charlie.stats.totalHours).toBe(0)
    expect(charlie.stats.timeEntriesCount).toBe(0)
  })

  it('should use hourlyRateManagerPLN if available, else default rate', async () => {
    const response = await fetch(
      `${API_BASE}/api/team?restaurantId=${testRestaurantId}`
    )

    const data = await response.json()
    const alice = data.teamMembers.find((m: any) => m.name === 'Alice Johnson')
    const bob = data.teamMembers.find((m: any) => m.name === 'Bob Smith')

    // Alice has hourlyRateManagerPLN = 45.00
    expect(parseFloat(alice.hourlyRate)).toBe(45.00)

    // Bob has no hourlyRateManagerPLN, should use hourlyRateDefaultPLN = 40.00
    expect(parseFloat(bob.hourlyRate)).toBe(40.00)
  })
})

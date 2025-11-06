/**
 * API Test: Time Entry Approval
 * 
 * Tests for:
 * - GET /api/time-entries/pending - Fetch pending entries for managers
 * - POST /api/time-entries/approve - Approve or reject entries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { isServerRunning } from './helpers/server-check'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe.skipIf(!(await isServerRunning()))('API: Time Entry Approval', () => {
  let testManagerUserId: string
  let testEmployeeUserId: string
  let testRestaurantId: string
  let testManagerMembershipId: string
  let testEmployeeMembershipId: string
  let testScheduleId: string
  let pendingEntryId: string
  let secondPendingEntryId: string

  beforeAll(async () => {
    // Create manager user
    const manager = await prisma.appUser.create({
      data: {
        authUserId: `test-manager-approval-${Date.now()}`,
        name: 'Test Manager',
        email: 'manager-approval@test.com',
        hourlyRateDefaultPLN: 50.00,
      },
    })
    testManagerUserId = manager.id

    // Create employee user
    const employee = await prisma.appUser.create({
      data: {
        authUserId: `test-employee-approval-${Date.now()}`,
        name: 'Test Employee',
        email: 'employee-approval@test.com',
        hourlyRateDefaultPLN: 35.00,
      },
    })
    testEmployeeUserId = employee.id

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Approval Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })
    testRestaurantId = restaurant.id

    // Create manager membership
    const managerMembership = await prisma.membership.create({
      data: {
        userId: testManagerUserId,
        restaurantId: testRestaurantId,
        role: 'manager',
        status: 'active',
      },
    })
    testManagerMembershipId = managerMembership.id

    // Create employee membership
    const employeeMembership = await prisma.membership.create({
      data: {
        userId: testEmployeeUserId,
        restaurantId: testRestaurantId,
        role: 'employee',
        status: 'active',
      },
    })
    testEmployeeMembershipId = employeeMembership.id

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        restaurantId: testRestaurantId,
        name: 'Test Approval Schedule',
        isActive: true,
      },
    })
    testScheduleId = schedule.id

    // Create pending time entries
    const entry1 = await prisma.timeEntry.create({
      data: {
        membershipId: testEmployeeMembershipId,
        scheduleId: testScheduleId,
        clockIn: new Date('2025-11-06T09:00:00Z'),
        clockOut: new Date('2025-11-06T17:00:00Z'), // 8 hours
        status: 'pending',
        adjustmentMinutes: 0,
      },
    })
    pendingEntryId = entry1.id

    const entry2 = await prisma.timeEntry.create({
      data: {
        membershipId: testEmployeeMembershipId,
        scheduleId: testScheduleId,
        clockIn: new Date('2025-11-07T09:00:00Z'),
        clockOut: new Date('2025-11-07T17:30:00Z'), // 8.5 hours
        status: 'pending',
        adjustmentMinutes: 15, // 15 min adjustment
      },
    })
    secondPendingEntryId = entry2.id

    // Create one already approved entry (should not appear in pending)
    await prisma.timeEntry.create({
      data: {
        membershipId: testEmployeeMembershipId,
        scheduleId: testScheduleId,
        clockIn: new Date('2025-11-05T09:00:00Z'),
        clockOut: new Date('2025-11-05T17:00:00Z'),
        status: 'approved',
        approvedByUserId: testManagerUserId,
        approvedAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    await prisma.timeEntry.deleteMany({
      where: { membershipId: testEmployeeMembershipId },
    })
    await prisma.schedule.deleteMany({
      where: { id: testScheduleId },
    })
    await prisma.membership.deleteMany({
      where: {
        OR: [
          { id: testManagerMembershipId },
          { id: testEmployeeMembershipId },
        ],
      },
    })
    await prisma.restaurant.deleteMany({
      where: { id: testRestaurantId },
    })
    await prisma.appUser.deleteMany({
      where: {
        OR: [
          { id: testManagerUserId },
          { id: testEmployeeUserId },
        ],
      },
    })

    await prisma.$disconnect()
  })

  describe('GET /api/time-entries/pending', () => {
    it('should return pending entries for restaurant', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/pending?restaurantId=${testRestaurantId}`
      )
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data).toHaveProperty('entries')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.entries)).toBe(true)
      expect(data.entries.length).toBeGreaterThanOrEqual(2) // At least our 2 pending entries
      
      // Check structure of entries
      const entry = data.entries[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('employeeName')
      expect(entry).toHaveProperty('clockIn')
      expect(entry).toHaveProperty('clockOut')
      expect(entry).toHaveProperty('totalHours')
      expect(entry).toHaveProperty('status', 'pending')
      expect(entry).toHaveProperty('scheduleName')
    })

    it('should calculate total hours correctly', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/pending?restaurantId=${testRestaurantId}`
      )
      
      const data = await response.json()
      const ourEntry = data.entries.find((e: any) => e.id === pendingEntryId)
      
      expect(ourEntry).toBeDefined()
      expect(ourEntry.totalHours).toBe(8) // 8 hours
    })

    it('should include adjustment minutes in calculation', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/pending?restaurantId=${testRestaurantId}`
      )
      
      const data = await response.json()
      const ourEntry = data.entries.find((e: any) => e.id === secondPendingEntryId)
      
      expect(ourEntry).toBeDefined()
      expect(ourEntry.adjustmentMinutes).toBe(15)
      // 8.5 hours + 15 min = 8.75 hours
      expect(ourEntry.totalHours).toBe(8.75)
    })

    it('should not return already approved entries', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/pending?restaurantId=${testRestaurantId}`
      )
      
      const data = await response.json()
      const approvedEntry = data.entries.find((e: any) => e.status === 'approved')
      
      expect(approvedEntry).toBeUndefined()
    })

    it('should return 400 without restaurantId', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/pending`
      )
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('restaurantId')
    })
  })

  describe('POST /api/time-entries/approve', () => {
    it('should approve a time entry', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryId: pendingEntryId,
            approved: true,
          }),
        }
      )
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.message).toContain('zatwierdzony')
      expect(data.entry).toHaveProperty('id', pendingEntryId)
      expect(data.entry).toHaveProperty('status', 'approved')
      
      // Verify in database
      const entry = await prisma.timeEntry.findUnique({
        where: { id: pendingEntryId },
      })
      
      expect(entry?.status).toBe('approved')
      expect(entry?.approvedByUserId).toBe(testManagerUserId)
      expect(entry?.approvedAt).toBeDefined()
    })

    it('should reject a time entry with reason', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryId: secondPendingEntryId,
            approved: false,
            reason: 'Nieprawidłowy czas wejścia',
          }),
        }
      )
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.message).toContain('odrzucony')
      expect(data.entry).toHaveProperty('status', 'rejected')
      
      // Verify in database
      const entry = await prisma.timeEntry.findUnique({
        where: { id: secondPendingEntryId },
      })
      
      expect(entry?.status).toBe('rejected')
      expect(entry?.reason).toBe('Nieprawidłowy czas wejścia')
    })

    it('should return 400 with invalid data', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryId: pendingEntryId,
            // Missing 'approved' field
          }),
        }
      )
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })

    it('should return 404 with non-existent entry', async () => {
      const response = await fetch(
        `${API_BASE}/api/time-entries/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryId: 'non-existent-id',
            approved: true,
          }),
        }
      )
      
      expect(response.status).toBe(404)
    })

    it('should return 400 when trying to approve non-pending entry', async () => {
      // First approve an entry
      await prisma.timeEntry.update({
        where: { id: pendingEntryId },
        data: { status: 'approved' },
      })

      // Try to approve again
      const response = await fetch(
        `${API_BASE}/api/time-entries/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryId: pendingEntryId,
            approved: true,
          }),
        }
      )
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('not in pending status')
    })
  })
})

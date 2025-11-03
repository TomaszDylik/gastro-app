/**
 * API Test: /api/availability
 * 
 * Tests for weekly availability grid endpoint including:
 * - GET - retrieve availability grid
 * - PUT - update availability grid
 * - Grid structure validation
 * - Time slot coverage
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('API: /api/availability', () => {
  let testUserId: string
  let testRestaurantId: string
  let testMembershipId: string

  beforeAll(async () => {
    // Create test data
    const user = await prisma.appUser.create({
      data: {
        authUserId: `test-availability-${Date.now()}`,
        name: 'Test Availability User',
        email: 'availability@test.com',
      },
    })
    testUserId = user.id

    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Availability Restaurant',
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
  })

  afterAll(async () => {
    // Cleanup
    if (testMembershipId) {
      await prisma.availability.deleteMany({ where: { membershipId: testMembershipId } })
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

  describe('GET /api/availability', () => {
    it('should return empty availability grid for new membership', async () => {
      const response = await fetch(
        `${API_BASE}/api/availability?membershipId=${testMembershipId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.availability).toBeDefined()
      expect(data.weekStart).toBeDefined()
      expect(data.weekEnd).toBeDefined()

      // Check all days are present
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      days.forEach(day => {
        expect(data.availability[day]).toBeDefined()
        expect(data.availability[day].morning).toBe(false)
        expect(data.availability[day].afternoon).toBe(false)
        expect(data.availability[day].evening).toBe(false)
      })
    })

    it('should return saved availability grid', async () => {
      // First, save some availability
      await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability: {
            mon: { morning: true, afternoon: true, evening: false },
            tue: { morning: false, afternoon: true, evening: true },
            wed: { morning: true, afternoon: false, evening: true },
            thu: { morning: true, afternoon: true, evening: true },
            fri: { morning: false, afternoon: false, evening: false },
            sat: { morning: true, afternoon: true, evening: false },
            sun: { morning: false, afternoon: false, evening: false },
          },
        }),
      })

      // Then retrieve it
      const response = await fetch(
        `${API_BASE}/api/availability?membershipId=${testMembershipId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.availability.mon.morning).toBe(true)
      expect(data.availability.mon.afternoon).toBe(true)
      expect(data.availability.mon.evening).toBe(false)
      
      expect(data.availability.tue.afternoon).toBe(true)
      expect(data.availability.tue.evening).toBe(true)
      
      expect(data.availability.fri.morning).toBe(false)
      expect(data.availability.fri.afternoon).toBe(false)
      expect(data.availability.fri.evening).toBe(false)
    })

    it('should require membershipId', async () => {
      const response = await fetch(`${API_BASE}/api/availability`)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('membershipId')
    })

    it('should validate membershipId existence', async () => {
      const response = await fetch(
        `${API_BASE}/api/availability?membershipId=non-existent-id`
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Membership not found')
    })
  })

  describe('PUT /api/availability', () => {
    it('should create availability records successfully', async () => {
      const availability = {
        mon: { morning: true, afternoon: false, evening: false },
        tue: { morning: true, afternoon: true, evening: false },
        wed: { morning: false, afternoon: true, evening: true },
        thu: { morning: true, afternoon: true, evening: true },
        fri: { morning: true, afternoon: false, evening: false },
        sat: { morning: false, afternoon: false, evening: false },
        sun: { morning: false, afternoon: false, evening: false },
      }

      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.message).toContain('updated successfully')
      expect(data.recordsCreated).toBeGreaterThan(0)
      expect(data.weekStart).toBeDefined()
    })

    it('should replace existing availability when updating', async () => {
      // Create initial availability
      await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability: {
            mon: { morning: true, afternoon: true, evening: true },
            tue: { morning: true, afternoon: true, evening: true },
            wed: { morning: true, afternoon: true, evening: true },
            thu: { morning: true, afternoon: true, evening: true },
            fri: { morning: true, afternoon: true, evening: true },
            sat: { morning: true, afternoon: true, evening: true },
            sun: { morning: true, afternoon: true, evening: true },
          },
        }),
      })

      // Update with different availability
      const newAvailability = {
        mon: { morning: false, afternoon: false, evening: false },
        tue: { morning: false, afternoon: false, evening: false },
        wed: { morning: false, afternoon: false, evening: false },
        thu: { morning: false, afternoon: false, evening: false },
        fri: { morning: false, afternoon: false, evening: false },
        sat: { morning: false, afternoon: false, evening: false },
        sun: { morning: false, afternoon: false, evening: false },
      }

      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability: newAvailability,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.recordsCreated).toBe(0) // All slots are false

      // Verify the update
      const getResponse = await fetch(
        `${API_BASE}/api/availability?membershipId=${testMembershipId}`
      )
      const getData = await getResponse.json()
      
      expect(getData.availability.mon.morning).toBe(false)
      expect(getData.availability.tue.afternoon).toBe(false)
    })

    it('should handle partial week availability', async () => {
      const availability = {
        mon: { morning: true, afternoon: false, evening: false },
        tue: { morning: false, afternoon: false, evening: false },
        wed: { morning: false, afternoon: false, evening: false },
        thu: { morning: false, afternoon: false, evening: false },
        fri: { morning: false, afternoon: false, evening: false },
        sat: { morning: false, afternoon: false, evening: false },
        sun: { morning: false, afternoon: false, evening: false },
      }

      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.recordsCreated).toBe(1) // Only Monday morning
    })

    it('should require membershipId', async () => {
      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: {
            mon: { morning: true, afternoon: false, evening: false },
          },
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should require availability data', async () => {
      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should validate membershipId existence', async () => {
      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: 'non-existent-id',
          availability: {
            mon: { morning: true, afternoon: false, evening: false },
          },
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Membership not found')
    })

    it('should handle full week availability', async () => {
      const availability = {
        mon: { morning: true, afternoon: true, evening: true },
        tue: { morning: true, afternoon: true, evening: true },
        wed: { morning: true, afternoon: true, evening: true },
        thu: { morning: true, afternoon: true, evening: true },
        fri: { morning: true, afternoon: true, evening: true },
        sat: { morning: true, afternoon: true, evening: true },
        sun: { morning: true, afternoon: true, evening: true },
      }

      const response = await fetch(`${API_BASE}/api/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: testMembershipId,
          availability,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.recordsCreated).toBe(21) // 7 days × 3 slots
    })
  })
})

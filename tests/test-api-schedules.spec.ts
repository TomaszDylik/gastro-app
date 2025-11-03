/**
 * API Test: /api/schedules
 * 
 * Tests for schedules management including:
 * - List schedules for restaurant
 * - Create new schedule
 * - Get single schedule with shifts
 * - Update schedule
 * - Delete schedule
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

describe('API: /api/schedules', () => {
  let testRestaurantId: string
  let testScheduleId: string

  beforeAll(async () => {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Schedules Restaurant',
        timezone: 'Europe/Warsaw',
      },
    })
    testRestaurantId = restaurant.id
  })

  afterAll(async () => {
    // Cleanup schedules and restaurant
    if (testRestaurantId) {
      const schedules = await prisma.schedule.findMany({
        where: { restaurantId: testRestaurantId },
      })
      
      for (const schedule of schedules) {
        await prisma.shift.deleteMany({ where: { scheduleId: schedule.id } })
        await prisma.availability.deleteMany({ where: { scheduleId: schedule.id } })
        await prisma.timeEntry.deleteMany({ where: { scheduleId: schedule.id } })
      }
      
      await prisma.schedule.deleteMany({ where: { restaurantId: testRestaurantId } })
      await prisma.restaurant.delete({ where: { id: testRestaurantId } })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/schedules', () => {
    it('should return empty list for restaurant with no schedules', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules?restaurantId=${testRestaurantId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.schedules).toBeDefined()
      expect(Array.isArray(data.schedules)).toBe(true)
      expect(data.total).toBe(0)
    })

    it('should return schedules list with statistics', async () => {
      // Create a schedule
      const schedule = await prisma.schedule.create({
        data: {
          restaurantId: testRestaurantId,
          name: 'Test Schedule 1',
          isActive: true,
        },
      })

      const response = await fetch(
        `${API_BASE}/api/schedules?restaurantId=${testRestaurantId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.schedules.length).toBe(1)
      expect(data.schedules[0].id).toBe(schedule.id)
      expect(data.schedules[0].name).toBe('Test Schedule 1')
      expect(data.schedules[0].isActive).toBe(true)
      expect(data.schedules[0].stats).toBeDefined()
      expect(data.schedules[0].stats.totalShifts).toBe(0)

      // Cleanup
      await prisma.schedule.delete({ where: { id: schedule.id } })
    })

    it('should require restaurantId', async () => {
      const response = await fetch(`${API_BASE}/api/schedules`)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('restaurantId')
    })

    it('should validate restaurantId existence', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules?restaurantId=non-existent-id`
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Restaurant not found')
    })
  })

  describe('POST /api/schedules', () => {
    it('should create new schedule successfully', async () => {
      const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: testRestaurantId,
          name: 'New Schedule',
          isActive: true,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.id).toBeDefined()
      expect(data.name).toBe('New Schedule')
      expect(data.isActive).toBe(true)
      expect(data.restaurantId).toBe(testRestaurantId)
      expect(data.createdAt).toBeDefined()

      testScheduleId = data.id

      // Verify in database
      const schedule = await prisma.schedule.findUnique({
        where: { id: data.id },
      })
      expect(schedule).toBeDefined()
      expect(schedule?.name).toBe('New Schedule')
    })

    it('should default isActive to true if not provided', async () => {
      const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: testRestaurantId,
          name: 'Schedule Without isActive',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.isActive).toBe(true)

      // Cleanup
      await prisma.schedule.delete({ where: { id: data.id } })
    })

    it('should require restaurantId and name', async () => {
      const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Missing Restaurant ID',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should validate restaurantId existence', async () => {
      const response = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: 'non-existent-id',
          name: 'Schedule for Non-existent Restaurant',
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Restaurant not found')
    })
  })

  describe('GET /api/schedules/[id]', () => {
    it('should return schedule details with shifts', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/${testScheduleId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.id).toBe(testScheduleId)
      expect(data.name).toBe('New Schedule')
      expect(data.isActive).toBe(true)
      expect(data.restaurant).toBeDefined()
      expect(data.shifts).toBeDefined()
      expect(Array.isArray(data.shifts)).toBe(true)
      expect(data.stats).toBeDefined()
    })

    it('should return 404 for non-existent schedule', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/non-existent-id`
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Schedule not found')
    })
  })

  describe('PUT /api/schedules/[id]', () => {
    it('should update schedule name', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/${testScheduleId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Updated Schedule Name',
          }),
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.name).toBe('Updated Schedule Name')
      expect(data.message).toContain('updated successfully')

      // Verify in database
      const schedule = await prisma.schedule.findUnique({
        where: { id: testScheduleId },
      })
      expect(schedule?.name).toBe('Updated Schedule Name')
    })

    it('should update isActive status', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/${testScheduleId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: false,
          }),
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.isActive).toBe(false)

      // Verify in database
      const schedule = await prisma.schedule.findUnique({
        where: { id: testScheduleId },
      })
      expect(schedule?.isActive).toBe(false)
    })

    it('should return 404 for non-existent schedule', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/non-existent-id`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Updated Name',
          }),
        }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Schedule not found')
    })
  })

  describe('DELETE /api/schedules/[id]', () => {
    it('should delete schedule successfully', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/${testScheduleId}`,
        {
          method: 'DELETE',
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.message).toContain('deleted successfully')
      expect(data.deletedScheduleId).toBe(testScheduleId)

      // Verify deleted from database
      const schedule = await prisma.schedule.findUnique({
        where: { id: testScheduleId },
      })
      expect(schedule).toBeNull()
    })

    it('should return 404 for non-existent schedule', async () => {
      const response = await fetch(
        `${API_BASE}/api/schedules/non-existent-id`,
        {
          method: 'DELETE',
        }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Schedule not found')
    })
  })
})

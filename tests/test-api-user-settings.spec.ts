/**
 * API Test: User Settings Endpoints
 * 
 * Tests for:
 * - PUT /api/users/me/password - password change
 * - GET /api/users/me/preferences - retrieve preferences
 * - PUT /api/users/me/preferences - update preferences
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Supabase client for auth testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

describe('API: User Settings', () => {
  let testUserId: string
  let testAuthUserId: string
  let testEmail: string
  let authToken: string

  beforeAll(async () => {
    // Create test user in Supabase Auth
    testEmail = `settings-test-${Date.now()}@test.com`
    const testPassword = 'TestPassword123!'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`)
    }

    testAuthUserId = authData.user.id

    // Create AppUser in database
    const user = await prisma.appUser.create({
      data: {
        authUserId: testAuthUserId,
        name: 'Settings Test User',
        email: testEmail,
        locale: 'pl',
      },
    })
    testUserId = user.id

    // Get auth token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError || !signInData.session) {
      throw new Error(`Failed to sign in: ${signInError?.message}`)
    }

    authToken = signInData.session.access_token
  })

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.appUser.delete({ where: { id: testUserId } })
    }
    if (testAuthUserId) {
      await supabase.auth.admin.deleteUser(testAuthUserId)
    }
    await prisma.$disconnect()
  })

  describe('PUT /api/users/me/password', () => {
    it('should change password successfully', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword123!',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Password updated successfully')

      // Verify new password works
      const { error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'NewPassword123!',
      })
      expect(error).toBeNull()

      // Change back to original password for other tests
      await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'NewPassword123!',
          newPassword: 'TestPassword123!',
        }),
      })
    })

    it('should reject incorrect current password', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Current password is incorrect')
    })

    it('should reject password shorter than 8 characters', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'TestPassword123!',
          newPassword: 'Short1!',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('at least 8 characters')
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewPassword123!',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('should validate missing fields', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'TestPassword123!',
          // missing newPassword
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/users/me/preferences', () => {
    it('should return default preferences for new user', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.notifications).toEqual({
        email: true,
        push: true,
        sms: false,
      })
      expect(data.theme).toBe('light')
      expect(data.language).toBe('pl')
    })

    it('should return saved preferences', async () => {
      // First, save some preferences
      await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          notifications: {
            email: false,
            push: true,
            sms: true,
          },
          theme: 'dark',
          language: 'en',
        }),
      })

      // Then retrieve them
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.notifications).toEqual({
        email: false,
        push: true,
        sms: true,
      })
      expect(data.theme).toBe('dark')
      expect(data.language).toBe('en')
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/users/me/preferences', () => {
    it('should update all preferences', async () => {
      const newPreferences = {
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        theme: 'auto' as const,
        language: 'pl' as const,
      }

      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(newPreferences),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.notifications).toEqual(newPreferences.notifications)
      expect(data.theme).toBe(newPreferences.theme)
      expect(data.language).toBe(newPreferences.language)

      // Verify in database
      const user = await prisma.appUser.findUnique({
        where: { id: testUserId },
      })
      expect(user?.preferences).toBeDefined()
      expect(user?.locale).toBe('pl')
    })

    it('should partially update preferences (merge)', async () => {
      // Set initial preferences
      await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          notifications: { email: true, push: true, sms: false },
          theme: 'light',
          language: 'pl',
        }),
      })

      // Update only notifications
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          notifications: { email: false, push: false, sms: true },
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // notifications should be updated
      expect(data.notifications).toEqual({ email: false, push: false, sms: true })
      // theme and language should remain
      expect(data.theme).toBe('light')
      expect(data.language).toBe('pl')
    })

    it('should update locale when language changes', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          language: 'en',
        }),
      })

      expect(response.status).toBe(200)

      // Verify locale updated in database
      const user = await prisma.appUser.findUnique({
        where: { id: testUserId },
      })
      expect(user?.locale).toBe('en')
    })

    it('should require authentication', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: 'dark',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('should validate preference values', async () => {
      const response = await fetch(`${API_BASE}/api/users/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          theme: 'invalid-theme',
        }),
      })

      // Should still return 200 but ignore invalid values or use defaults
      expect(response.status).toBe(200)
    })
  })
})

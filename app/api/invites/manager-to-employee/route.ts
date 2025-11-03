/**
 * ETAP 12.1: Zaproszenia Manager → Employee
 *
 * Manager może zaprosić pracownika do restauracji
 *
 * POST /api/invites/manager-to-employee
 * Body: {
 *   restaurantId: string
 *   email: string
 *   firstName: string
 *   lastName: string
 *   hourlyRate: number
 * }
 *
 * Response: {
 *   token: string
 *   expiresAt: string
 *   inviteUrl: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, email, firstName, lastName, hourlyRate } = body

    // Mock auth - w produkcji z Supabase JWT
    const actorUserId = request.headers.get('x-user-id')
    const actorRole = request.headers.get('x-user-role')

    if (!actorUserId || !actorRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check: manager, owner, lub super_admin
    if (!['manager', 'owner', 'super_admin'].includes(actorRole)) {
      return NextResponse.json(
        { error: 'Forbidden - only manager can invite employees' },
        { status: 403 },
      )
    }

    // Validate input
    if (!restaurantId || !email || !firstName || !lastName || hourlyRate == null) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, email, firstName, lastName, hourlyRate' },
        { status: 400 },
      )
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Verify manager has access to this restaurant
    if (actorRole === 'manager') {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: actorUserId,
          restaurantId,
          role: 'manager',
          status: 'active',
        },
      })

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden - you are not a manager of this restaurant' },
          { status: 403 },
        )
      }
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation
    const invite = await prisma.invite.create({
      data: {
        token,
        email,
        firstName,
        lastName,
        role: 'employee',
        hourlyRate,
        restaurantId,
        invitedById: actorUserId,
        expiresAt,
        status: 'pending',
        contact: email, // Deprecated field for compatibility
        tokenHash: token, // Deprecated field for compatibility
      },
    })

    // Generate invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/invite/${token}`

    return NextResponse.json(
      {
        id: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
        inviteUrl,
        email: invite.email,
        role: invite.role,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

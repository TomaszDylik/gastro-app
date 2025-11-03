/**
 * ETAP 12.1: Akceptacja zaproszenia
 *
 * Publiczny endpoint - tworzy AppUser + Membership
 *
 * POST /api/invites/accept
 * Body: {
 *   token: string
 *   password: string (opcjonalnie - może być SSO)
 * }
 *
 * Response: {
 *   userId: string
 *   membershipId: string
 *   restaurantId: string
 *   role: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Find invitation
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        restaurant: true,
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    // Check if already used
    if (invite.status === 'accepted') {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      })
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
    }

    // Check if user with this email already exists
    let user = await prisma.appUser.findFirst({
      where: { authUserId: invite.email }, // Using email as temp authUserId
    })

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.appUser.create({
        data: {
          authUserId: invite.email, // Temporary - should be from SSO
          name: `${invite.firstName} ${invite.lastName}`,
          email: invite.email,
          // W produkcji: password hash, SSO integration
        },
      })
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        restaurantId: invite.restaurantId,
        role: invite.role === 'manager' ? 'manager' : 'employee',
        hourlyRateManagerPLN: invite.hourlyRate,
        status: 'active',
      },
    })

    // Mark invitation as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedByUserId: user.id,
      },
    })

    return NextResponse.json(
      {
        userId: user.id,
        membershipId: membership.id,
        restaurantId: membership.restaurantId,
        role: membership.role,
        hourlyRate: membership.hourlyRateManagerPLN,
        restaurant: {
          id: invite.restaurant.id,
          name: invite.restaurant.name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

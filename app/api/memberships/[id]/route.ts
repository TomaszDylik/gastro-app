/**
 * DELETE /api/memberships/[id]
 * Usuwa członkostwo (soft delete - zachowuje historię)
 * Manager może usunąć pracownika z restauracji
 * Pracownik może sam opuścić restaurację
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createAuditLog } from '@/lib/audit'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const membershipId = params.id
    const body = await request.json()
    const { actorUserId, reason } = body

    if (!actorUserId) {
      return NextResponse.json({ error: 'actorUserId is required' }, { status: 400 })
    }

    // Get membership details before deletion
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        restaurant: true,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check permission: manager removing employee OR employee leaving themselves
    const actor = await prisma.appUser.findUnique({
      where: { id: actorUserId },
      include: {
        memberships: {
          where: { restaurantId: membership.restaurantId },
        },
      },
    })

    if (!actor) {
      return NextResponse.json({ error: 'Actor not found' }, { status: 404 })
    }

    const actorMembership = actor.memberships[0]
    const managerRoles = ['manager', 'owner', 'super_admin']
    const isManager = actorMembership && managerRoles.includes(actorMembership.role)
    const isSelfLeaving = actorUserId === membership.userId

    if (!isManager && !isSelfLeaving) {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can remove others, or users can remove themselves' },
        { status: 403 }
      )
    }

    // Soft delete: update status to inactive (or delete if preferred)
    // Option 1: Update status
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: 'pending', // Using pending as "inactive" - could add new status
      },
    })

    // Option 2: Hard delete (but keep history in TimeEntries via IDs)
    // await prisma.membership.delete({ where: { id: membershipId } })

    // Log the action
    const action = isSelfLeaving ? 'membership.leave' : 'membership.remove'
    await createAuditLog({
      actorUserId,
      restaurantId: membership.restaurantId,
      entityType: 'Membership',
      entityId: membershipId,
      action,
      before: {
        userId: membership.userId,
        userName: membership.user.name,
        role: membership.role,
        restaurantId: membership.restaurantId,
        restaurantName: membership.restaurant.name,
        status: membership.status,
      },
      after: {
        status: 'removed',
        reason,
        removedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: isSelfLeaving ? 'You have left the restaurant' : 'Employee removed from restaurant',
      membershipId,
    })
  } catch (error) {
    console.error('Error removing membership:', error)
    return NextResponse.json({ error: 'Failed to remove membership' }, { status: 500 })
  }
}

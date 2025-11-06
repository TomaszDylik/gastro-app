import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/time-entries/approve
 * Approve or reject a time entry
 * 
 * Body:
 * - entryId: string (required)
 * - approved: boolean (required)
 * - reason: string (optional, for rejections)
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId, approved, reason } = await request.json()

    if (!entryId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Get current user
    const appUser = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!appUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the time entry to verify manager has permission
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: {
        membership: {
          include: {
            restaurant: true,
          },
        },
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    // Verify user is a manager for this restaurant
    const managerMembership = await prisma.membership.findFirst({
      where: {
        userId: appUser.id,
        restaurantId: timeEntry.membership.restaurantId,
        role: 'manager',
      },
    })

    if (!managerMembership) {
      return NextResponse.json({ error: 'Not authorized to approve entries for this restaurant' }, { status: 403 })
    }

    // Verify entry is in pending status
    if (timeEntry.status !== 'pending') {
      return NextResponse.json({ error: 'Entry is not in pending status' }, { status: 400 })
    }

    const now = new Date()

    if (approved) {
      // Approve the entry
      await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
          approvedByUserId: appUser.id,
          approvedAt: now,
          status: 'approved',
        },
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Wpis zatwierdzony',
        entry: { id: entryId, status: 'approved' }
      })
    } else {
      // Reject the entry
      await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
          status: 'rejected',
          reason: reason || 'Odrzucone przez menedżera',
        },
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Wpis odrzucony',
        entry: { id: entryId, status: 'rejected' }
      })
    }
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}

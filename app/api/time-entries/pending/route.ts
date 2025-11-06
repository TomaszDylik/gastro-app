import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/time-entries/pending
 * Get all pending time entries for a manager to approve
 * 
 * Query params:
 * - restaurantId: Filter by restaurant (required for managers)
 */
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 })
    }

    // Get current user and verify they're a manager
    const appUser = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        memberships: {
          where: {
            restaurantId,
            role: 'manager',
          },
        },
      },
    })

    if (!appUser || appUser.memberships.length === 0) {
      return NextResponse.json({ error: 'Not authorized as manager for this restaurant' }, { status: 403 })
    }

    // Fetch pending time entries for this restaurant
    const pendingEntries = await prisma.timeEntry.findMany({
      where: {
        status: 'pending',
        membership: {
          restaurantId,
        },
        clockOut: {
          not: null, // Only completed entries
        },
      },
      include: {
        membership: {
          include: {
            user: true,
          },
        },
        schedule: true,
      },
      orderBy: {
        clockIn: 'desc',
      },
    })

    // Transform data for frontend
    const entries = pendingEntries.map((entry) => {
      const clockIn = new Date(entry.clockIn)
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : null
      
      let totalHours = 0
      if (clockOut) {
        const diffMs = clockOut.getTime() - clockIn.getTime()
        const diffMinutes = diffMs / (1000 * 60)
        const adjustedMinutes = diffMinutes + entry.adjustmentMinutes
        totalHours = adjustedMinutes / 60
      }

      return {
        id: entry.id,
        employeeName: entry.membership.user.name || 'Unknown',
        employeeId: entry.membership.userId,
        clockIn: clockIn.toISOString(),
        clockOut: clockOut?.toISOString() || null,
        totalHours: Math.round(totalHours * 100) / 100,
        date: clockIn.toISOString().split('T')[0],
        status: entry.status,
        scheduleName: entry.schedule.name,
        adjustmentMinutes: entry.adjustmentMinutes,
      }
    })

    return NextResponse.json({
      entries,
      total: entries.length,
    })
  } catch (error) {
    console.error('Error fetching pending entries:', error)
    return NextResponse.json({ error: 'Failed to fetch pending entries' }, { status: 500 })
  }
}

/**
 * API: Team Management
 * 
 * GET /api/team - Get team members list with stats
 * Query: restaurantId
 * Returns: List of employees with their statistics (shifts, hours, status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { startOfMonth, endOfMonth } from 'date-fns'

const prisma = new PrismaClient()

/**
 * GET /api/team
 * Returns team members with statistics for a restaurant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get all memberships for this restaurant
    const memberships = await prisma.membership.findMany({
      where: {
        restaurantId,
      },
      include: {
        user: true,
        shiftAssignments: {
          include: {
            shift: true,
          },
          where: {
            shift: {
              start: {
                gte: startOfMonth(new Date()),
                lte: endOfMonth(new Date()),
              },
            },
          },
        },
        timeEntries: {
          where: {
            clockIn: {
              gte: startOfMonth(new Date()),
              lte: endOfMonth(new Date()),
            },
          },
        },
      },
    })

    // Transform to team member format with stats
    const teamMembers = memberships.map(membership => {
      // Calculate total hours worked this month
      const totalMinutes = membership.timeEntries.reduce((total, entry) => {
        if (!entry.clockOut) return total
        const minutes = (entry.clockOut.getTime() - entry.clockIn.getTime()) / 1000 / 60
        return total + minutes + (entry.adjustmentMinutes || 0)
      }, 0)

      const totalHours = Math.round((totalMinutes / 60) * 10) / 10

      // Count shifts by status
      const shiftsAssigned = membership.shiftAssignments.filter(
        a => a.status === 'assigned'
      ).length
      const shiftsCompleted = membership.shiftAssignments.filter(
        a => a.status === 'completed'
      ).length
      const shiftsDeclined = membership.shiftAssignments.filter(
        a => a.status === 'declined'
      ).length

      // Calculate upcoming shifts (future shifts with 'assigned' status)
      const upcomingShifts = membership.shiftAssignments.filter(
        a => a.status === 'assigned' && a.shift.start > new Date()
      ).length

      return {
        id: membership.id,
        userId: membership.user.id,
        name: membership.user.name || 'Unknown',
        email: membership.user.email || '',
        phone: membership.user.phone || '',
        role: membership.role,
        status: membership.status,
        hourlyRate: membership.hourlyRateManagerPLN?.toString() || membership.user.hourlyRateDefaultPLN?.toString() || '0',
        stats: {
          totalHours,
          shiftsAssigned,
          shiftsCompleted,
          shiftsDeclined,
          upcomingShifts,
          totalShifts: membership.shiftAssignments.length,
          timeEntriesCount: membership.timeEntries.length,
        },
        joinedAt: membership.createdAt.toISOString(),
      }
    })

    // Sort by status (active first) and then by name
    teamMembers.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return (a.name || '').localeCompare(b.name || '')
    })

    // Calculate aggregate stats
    const aggregateStats = {
      totalMembers: teamMembers.length,
      activeMembers: teamMembers.filter(m => m.status === 'active').length,
      pendingMembers: teamMembers.filter(m => m.status === 'pending').length,
      totalHoursThisMonth: teamMembers.reduce((sum, m) => sum + m.stats.totalHours, 0),
      totalShiftsThisMonth: teamMembers.reduce((sum, m) => sum + m.stats.totalShifts, 0),
    }

    return NextResponse.json({
      teamMembers,
      stats: aggregateStats,
      month: new Date().toISOString().split('T')[0].substring(0, 7), // YYYY-MM
    })

  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

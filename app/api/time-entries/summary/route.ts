import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, format } from 'date-fns'
import { pl } from 'date-fns/locale'

const prisma = new PrismaClient()

/**
 * GET /api/time-entries/summary
 * 
 * Returns monthly summary for a user including:
 * - Total hours (all, approved, pending)
 * - Earnings estimation
 * - Weekly breakdown
 * - Recent entries
 * 
 * Query params:
 * - membershipId: string (required)
 * - month?: string (YYYY-MM format, defaults to current month)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')
    const monthParam = searchParams.get('month')

    // Validation
    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId is required' },
        { status: 400 }
      )
    }

    // Parse month (default to current month)
    const targetDate = monthParam ? new Date(monthParam + '-01') : new Date()
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Check if membership exists
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

    // Calculate effective hourly rate
    const hourlyRate = membership.hourlyRateManagerPLN 
      ? Number(membership.hourlyRateManagerPLN)
      : membership.user.hourlyRateDefaultPLN
        ? Number(membership.user.hourlyRateDefaultPLN)
        : 0

    // Fetch all time entries for the month
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        membershipId,
        clockIn: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        schedule: true,
      },
      orderBy: {
        clockIn: 'desc',
      },
    })

    // Calculate totals
    let totalMinutes = 0
    let approvedMinutes = 0
    let pendingMinutes = 0

    timeEntries.forEach(entry => {
      if (entry.clockOut) {
        const minutes = Math.floor(
          (entry.clockOut.getTime() - entry.clockIn.getTime()) / 1000 / 60
        ) + entry.adjustmentMinutes

        totalMinutes += minutes

        if (entry.status === 'approved') {
          approvedMinutes += minutes
        } else if (entry.status === 'pending' || entry.status === 'active') {
          pendingMinutes += minutes
        }
      }
    })

    const totalHours = Number((totalMinutes / 60).toFixed(2))
    const approvedHours = Number((approvedMinutes / 60).toFixed(2))
    const pendingHours = Number((pendingMinutes / 60).toFixed(2))
    const estimatedEarnings = Number((totalHours * hourlyRate).toFixed(2))
    const approvedEarnings = Number((approvedHours * hourlyRate).toFixed(2))

    // Calculate weekly breakdown
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } // Monday
    )

    const weeklyData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      const weekEntries = timeEntries.filter(entry => {
        return entry.clockIn >= weekStart && entry.clockIn <= weekEnd
      })

      let weekMinutes = 0
      let weekApprovedMinutes = 0
      let allApproved = true

      weekEntries.forEach(entry => {
        if (entry.clockOut) {
          const minutes = Math.floor(
            (entry.clockOut.getTime() - entry.clockIn.getTime()) / 1000 / 60
          ) + entry.adjustmentMinutes

          weekMinutes += minutes

          if (entry.status === 'approved') {
            weekApprovedMinutes += minutes
          } else {
            allApproved = false
          }
        } else {
          allApproved = false
        }
      })

      const hours = Number((weekMinutes / 60).toFixed(2))
      const earnings = Number((hours * hourlyRate).toFixed(2))
      
      // Status: approved if all entries approved, pending if any pending/active
      const status = weekEntries.length === 0 
        ? 'empty' 
        : allApproved 
          ? 'approved' 
          : 'pending'

      return {
        week: `Tydzień ${index + 1}`,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        hours,
        earnings,
        status,
        entriesCount: weekEntries.length,
      }
    }).filter(week => week.entriesCount > 0 || week.status !== 'empty')

    // Get recent entries (last 10)
    const recentEntries = timeEntries
      .slice(0, 10)
      .map(entry => ({
        id: entry.id,
        date: format(entry.clockIn, 'yyyy-MM-dd'),
        clockIn: format(entry.clockIn, 'HH:mm'),
        clockOut: entry.clockOut ? format(entry.clockOut, 'HH:mm') : null,
        hours: entry.clockOut 
          ? Number((
              (entry.clockOut.getTime() - entry.clockIn.getTime()) / 1000 / 60 / 60
              + entry.adjustmentMinutes / 60
            ).toFixed(2))
          : null,
        earnings: entry.clockOut
          ? Number((
              ((entry.clockOut.getTime() - entry.clockIn.getTime()) / 1000 / 60 / 60
              + entry.adjustmentMinutes / 60) * hourlyRate
            ).toFixed(2))
          : null,
        status: entry.status,
        scheduleName: entry.schedule.name,
        adjustmentMinutes: entry.adjustmentMinutes,
      }))

    return NextResponse.json({
      summary: {
        totalHours,
        approvedHours,
        pendingHours,
        hourlyRate,
        estimatedEarnings,
        approvedEarnings,
      },
      weeklyData,
      recentEntries,
      month: format(targetDate, 'LLLL yyyy', { locale: pl }),
      monthStart: format(monthStart, 'yyyy-MM-dd'),
      monthEnd: format(monthEnd, 'yyyy-MM-dd'),
    })

  } catch (error) {
    console.error('Error fetching time entries summary:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

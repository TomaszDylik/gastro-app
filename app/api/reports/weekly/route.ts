import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/reports/weekly
 * 
 * Generate weekly report for a restaurant
 * Week runs Monday-Sunday
 * 
 * Body:
 * - restaurantId: string
 * - weekStart: string (YYYY-MM-DD, must be Monday)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, weekStart } = body

    if (!restaurantId || !weekStart) {
      return NextResponse.json(
        { error: 'restaurantId and weekStart are required' },
        { status: 400 }
      )
    }

    // Validate weekStart is Monday
    const weekStartDate = new Date(weekStart)
    weekStartDate.setHours(0, 0, 0, 0)
    
    if (weekStartDate.getDay() !== 1) { // 1 = Monday
      return NextResponse.json(
        { error: 'weekStart must be a Monday' },
        { status: 400 }
      )
    }

    // Check if report already exists
    const existingReport = await prisma.reportWeekly.findUnique({
      where: {
        restaurantId_weekStart: {
          restaurantId,
          weekStart: weekStartDate
        }
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Weekly report already exists for this week', report: existingReport },
        { status: 409 }
      )
    }

    // Calculate week end (Sunday)
    const weekEnd = new Date(weekStartDate)
    weekEnd.setDate(weekEnd.getDate() + 6) // +6 days = Sunday
    weekEnd.setHours(23, 59, 59, 999)

    // Get all daily reports for this week
    const dailyReports = await prisma.reportDaily.findMany({
      where: {
        restaurantId,
        date: {
          gte: weekStartDate,
          lte: weekEnd
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get all TimeEntries for this week (for detailed calculations)
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        schedule: {
          restaurantId
        },
        clockIn: {
          gte: weekStartDate,
          lte: weekEnd
        },
        clockOut: {
          not: null
        }
      },
      include: {
        membership: {
          include: {
            user: true
          }
        }
      }
    })

    // Aggregate by employee
    const employeeTotals = new Map<string, {
      userId: string
      userName: string
      totalHours: number
      totalAmount: number
      days: number
    }>()

    for (const entry of timeEntries) {
      if (!entry.clockOut) continue

      const userId = entry.membership.userId
      const userName = entry.membership.user.name || entry.membership.user.email || 'Unknown'

      // Calculate hours
      const durationMs = entry.clockOut.getTime() - entry.clockIn.getTime()
      const hours = durationMs / (1000 * 60 * 60)
      const adjustedHours = hours + (entry.adjustmentMinutes / 60)

      // Get effective hourly rate
      const hourlyRate = Number(entry.membership.hourlyRateManagerPLN || entry.membership.user.hourlyRateDefaultPLN || 0)
      const amount = adjustedHours * hourlyRate

      if (!employeeTotals.has(userId)) {
        employeeTotals.set(userId, {
          userId,
          userName,
          totalHours: 0,
          totalAmount: 0,
          days: 0
        })
      }

      const totals = employeeTotals.get(userId)!
      totals.totalHours += adjustedHours
      totals.totalAmount += amount
      totals.days += 1
    }

    // Convert to array and round
    const employeeData = Array.from(employeeTotals.values()).map(emp => ({
      userId: emp.userId,
      userName: emp.userName,
      totalHours: Math.round(emp.totalHours * 100) / 100,
      totalAmount: Math.round(emp.totalAmount * 100) / 100,
      days: emp.days
    }))

    // Calculate grand totals
    const grandTotalHours = employeeData.reduce((sum, emp) => sum + emp.totalHours, 0)
    const grandTotalAmount = employeeData.reduce((sum, emp) => sum + emp.totalAmount, 0)

    const totalsJson = {
      weekStart: weekStartDate.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      employees: employeeData,
      grandTotalHours: Math.round(grandTotalHours * 100) / 100,
      grandTotalAmount: Math.round(grandTotalAmount * 100) / 100,
      dailyReportsCount: dailyReports.length
    }

    // Create weekly report
    const weeklyReport = await prisma.reportWeekly.create({
      data: {
        restaurantId,
        weekStart: weekStartDate,
        totalsJson
      }
    })

    return NextResponse.json({
      success: true,
      report: weeklyReport
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Weekly report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/weekly?restaurantId=xxx&weekStart=YYYY-MM-DD
 * 
 * Get weekly report for a specific week
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const weekStart = searchParams.get('weekStart')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // If weekStart provided, get specific week
    if (weekStart) {
      const weekStartDate = new Date(weekStart)
      weekStartDate.setHours(0, 0, 0, 0)

      const report = await prisma.reportWeekly.findUnique({
        where: {
          restaurantId_weekStart: {
            restaurantId,
            weekStart: weekStartDate
          }
        }
      })

      if (!report) {
        return NextResponse.json(
          { error: 'Weekly report not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ report })
    }

    // Otherwise, get all weekly reports for restaurant
    const reports = await prisma.reportWeekly.findMany({
      where: { restaurantId },
      orderBy: { weekStart: 'desc' },
      take: 20 // Last 20 weeks
    })

    return NextResponse.json({ reports })

  } catch (error) {
    console.error('❌ Get weekly report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

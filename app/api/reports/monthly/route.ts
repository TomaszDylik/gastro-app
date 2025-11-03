import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/reports/monthly
 * 
 * Generate monthly report for a restaurant
 * 
 * Body:
 * - restaurantId: string
 * - periodMonth: string (YYYY-MM-01 - first day of month)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, periodMonth } = body

    if (!restaurantId || !periodMonth) {
      return NextResponse.json(
        { error: 'restaurantId and periodMonth are required' },
        { status: 400 }
      )
    }

    // Parse and validate periodMonth
    const monthDate = new Date(periodMonth)
    monthDate.setHours(0, 0, 0, 0)
    
    // Ensure it's the first day of the month
    if (monthDate.getDate() !== 1) {
      return NextResponse.json(
        { error: 'periodMonth must be the first day of the month (YYYY-MM-01)' },
        { status: 400 }
      )
    }

    // Check if report already exists
    const existingReport = await prisma.reportMonthly.findUnique({
      where: {
        restaurantId_periodMonth: {
          restaurantId,
          periodMonth: monthDate
        }
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Monthly report already exists for this month', report: existingReport },
        { status: 409 }
      )
    }

    // Calculate month end
    const monthEnd = new Date(monthDate)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0) // Last day of month
    monthEnd.setHours(23, 59, 59, 999)

    // Get all TimeEntries for this month
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        schedule: {
          restaurantId
        },
        clockIn: {
          gte: monthDate,
          lte: monthEnd
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

    // Get month name
    const monthName = monthDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

    const totalsJson = {
      month: monthDate.toISOString().split('T')[0],
      monthName,
      employees: employeeData,
      grandTotalHours: Math.round(grandTotalHours * 100) / 100,
      grandTotalAmount: Math.round(grandTotalAmount * 100) / 100,
      timeEntriesCount: timeEntries.length
    }

    // Create monthly report
    const monthlyReport = await prisma.reportMonthly.create({
      data: {
        restaurantId,
        periodMonth: monthDate,
        totalsJson
      }
    })

    return NextResponse.json({
      success: true,
      report: monthlyReport
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Monthly report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/monthly?restaurantId=xxx&periodMonth=YYYY-MM-01
 * 
 * Get monthly report for a specific month
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const periodMonth = searchParams.get('periodMonth')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      )
    }

    // If periodMonth provided, get specific month
    if (periodMonth) {
      const monthDate = new Date(periodMonth)
      monthDate.setHours(0, 0, 0, 0)

      const report = await prisma.reportMonthly.findUnique({
        where: {
          restaurantId_periodMonth: {
            restaurantId,
            periodMonth: monthDate
          }
        }
      })

      if (!report) {
        return NextResponse.json(
          { error: 'Monthly report not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ report })
    }

    // Otherwise, get all monthly reports for restaurant
    const reports = await prisma.reportMonthly.findMany({
      where: { restaurantId },
      orderBy: { periodMonth: 'desc' },
      take: 12 // Last 12 months
    })

    return NextResponse.json({ reports })

  } catch (error) {
    console.error('❌ Get monthly report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

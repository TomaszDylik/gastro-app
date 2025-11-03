import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/reports/daily
 *
 * Generate daily report for a restaurant on a specific date
 *
 * Body: { restaurantId, date (YYYY-MM-DD) }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Parse request
    const body = await request.json()
    const { restaurantId, date } = body

    if (!restaurantId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, date' },
        { status: 400 }
      )
    }

    // 4. Check permission (manager or owner)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId,
        status: 'active',
        role: {
          in: ['owner', 'manager', 'super_admin'],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Only managers and owners can generate reports' },
        { status: 403 }
      )
    }

    // 5. Check if report already exists
    const reportDate = new Date(date)
    const existing = await prisma.reportDaily.findUnique({
      where: {
        restaurantId_date: {
          restaurantId,
          date: reportDate,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Report for this date already exists' }, { status: 409 })
    }

    // 6. Get all time entries for this date
    const startOfDay = new Date(reportDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(reportDate)
    endOfDay.setHours(23, 59, 59, 999)

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        membership: {
          restaurantId,
        },
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
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
      },
    })

    // 7. Calculate totals per employee
    const totalsMap = new Map<
      string,
      {
        userId: string
        userName: string
        membershipId: string
        role: string
        totalHours: number
        hourlyRate: number
        totalAmount: number
        entries: number
      }
    >()

    for (const entry of timeEntries) {
      const membership = entry.membership
      const clockIn = entry.clockIn
      const clockOut = entry.clockOut!

      // Calculate hours (including adjustment)
      const durationMs = clockOut.getTime() - clockIn.getTime()
      const durationMinutes = Math.floor(durationMs / (1000 * 60)) + (entry.adjustmentMinutes || 0)
      const hours = Number((durationMinutes / 60).toFixed(2))

      // Get hourly rate (manager rate if available, else default)
      const hourlyRate = Number(membership.hourlyRateManagerPLN || 0)

      const amount = Number((hours * hourlyRate).toFixed(2))

      const key = membership.id
      if (!totalsMap.has(key)) {
        totalsMap.set(key, {
          userId: membership.userId,
          userName: membership.user.name || 'Unknown',
          membershipId: membership.id,
          role: membership.role,
          totalHours: 0,
          hourlyRate,
          totalAmount: 0,
          entries: 0,
        })
      }

      const existing = totalsMap.get(key)!
      existing.totalHours += hours
      existing.totalAmount += amount
      existing.entries += 1

      // Round totals
      existing.totalHours = Number(existing.totalHours.toFixed(2))
      existing.totalAmount = Number(existing.totalAmount.toFixed(2))
    }

    // 8. Create totals JSON
    const totalsArray = Array.from(totalsMap.values())
    const totalsJson = {
      date: date,
      restaurantId,
      employees: totalsArray,
      summary: {
        totalEmployees: totalsArray.length,
        totalHours: Number(totalsArray.reduce((sum, e) => sum + e.totalHours, 0).toFixed(2)),
        totalAmount: Number(totalsArray.reduce((sum, e) => sum + e.totalAmount, 0).toFixed(2)),
      },
    }

    // 9. Create report
    const report = await prisma.reportDaily.create({
      data: {
        restaurantId,
        date: reportDate,
        totalsJson,
        signatureLogJson: [],
      },
    })

    return NextResponse.json(
      {
        report: {
          id: report.id,
          restaurantId: report.restaurantId,
          date: report.date.toISOString(),
          totals: totalsJson,
          signedByUserId: report.signedByUserId,
          signedAt: report.signedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error generating daily report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * GET /api/reports/daily?restaurantId=xxx&date=YYYY-MM-DD
 *
 * Get daily report for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const date = searchParams.get('date')

    if (!restaurantId || !date) {
      return NextResponse.json(
        { error: 'Missing required params: restaurantId, date' },
        { status: 400 }
      )
    }

    // 4. Check permission
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId,
        status: 'active',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this restaurant' },
        { status: 403 }
      )
    }

    // 5. Get report
    const reportDate = new Date(date)
    const report = await prisma.reportDaily.findUnique({
      where: {
        restaurantId_date: {
          restaurantId,
          date: reportDate,
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({
      report: {
        id: report.id,
        restaurantId: report.restaurantId,
        date: report.date.toISOString(),
        totals: report.totalsJson,
        signedByUserId: report.signedByUserId,
        signedAt: report.signedAt?.toISOString(),
        signatureLog: report.signatureLogJson,
      },
    })
  } catch (error) {
    console.error('Error fetching daily report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

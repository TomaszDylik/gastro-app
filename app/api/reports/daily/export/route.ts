import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateCSV, generateXLSX, formatDailyExport } from '@/lib/export-formats'

const prisma = new PrismaClient()

/**
 * GET /api/reports/daily/export?restaurantId=xxx&date=YYYY-MM-DD&format=csv|xlsx
 *
 * Export daily report as CSV or XLSX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const dateParam = searchParams.get('date')
    const format = searchParams.get('format') || 'xlsx'

    if (!restaurantId || !dateParam) {
      return NextResponse.json({ error: 'restaurantId and date are required' }, { status: 400 })
    }

    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json({ error: 'format must be csv or xlsx' }, { status: 400 })
    }

    const date = new Date(dateParam)
    date.setHours(0, 0, 0, 0)

    // Get time entries for this day
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        schedule: {
          restaurantId,
        },
        clockIn: {
          gte: date,
          lte: dayEnd,
        },
      },
      include: {
        membership: {
          include: {
            user: true,
            restaurant: true,
          },
        },
      },
      orderBy: {
        clockIn: 'asc',
      },
    })

    if (timeEntries.length === 0) {
      return NextResponse.json({ error: 'No time entries found for this date' }, { status: 404 })
    }

    // Get approver names
    const approverIds = timeEntries
      .filter((e) => e.approvedByUserId)
      .map((e) => e.approvedByUserId!)

    const approvers = await prisma.appUser.findMany({
      where: {
        id: {
          in: approverIds,
        },
      },
    })

    const approverNames = new Map(approvers.map((a) => [a.id, a.name || a.email || a.id]))

    // Format data
    const exportData = formatDailyExport({
      timeEntries: timeEntries as any,
      approverNames,
    })

    const restaurantName = timeEntries[0]?.membership.restaurant.name || 'Restaurant'
    const filename = `raport_dzienny_${restaurantName.replace(/\s+/g, '_')}_${dateParam}.${format}`

    // Generate file
    if (format === 'csv') {
      const csv = generateCSV(exportData)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } else {
      // XLSX
      const buffer = generateXLSX(exportData, `Raport ${dateParam}`)

      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('❌ Daily export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

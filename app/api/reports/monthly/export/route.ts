import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateCSV, generateXLSX, formatMonthlyExport } from '@/lib/export-formats'

const prisma = new PrismaClient()

/**
 * GET /api/reports/monthly/export?restaurantId=xxx&periodMonth=YYYY-MM-01&format=csv|xlsx
 * 
 * Export monthly report as CSV or XLSX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const periodMonth = searchParams.get('periodMonth')
    const format = searchParams.get('format') || 'xlsx'

    if (!restaurantId || !periodMonth) {
      return NextResponse.json(
        { error: 'restaurantId and periodMonth are required' },
        { status: 400 }
      )
    }

    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json(
        { error: 'format must be csv or xlsx' },
        { status: 400 }
      )
    }

    // Get monthly report
    const monthDate = new Date(periodMonth)
    monthDate.setHours(0, 0, 0, 0)

    const monthlyReport = await prisma.reportMonthly.findUnique({
      where: {
        restaurantId_periodMonth: {
          restaurantId,
          periodMonth: monthDate
        }
      },
      include: {
        restaurant: true
      }
    })

    if (!monthlyReport) {
      return NextResponse.json(
        { error: 'Monthly report not found' },
        { status: 404 }
      )
    }

    const totals: any = monthlyReport.totalsJson
    const restaurantName = monthlyReport.restaurant.name

    // Format data
    const exportData = formatMonthlyExport({
      restaurantId,
      restaurantName,
      monthlyData: totals.employees.map((emp: any) => ({
        userId: emp.userId,
        userName: emp.userName,
        totalHours: emp.totalHours,
        totalAmount: emp.totalAmount,
        hourlyRate: emp.totalHours > 0 ? emp.totalAmount / emp.totalHours : 0
      })),
      month: totals.monthName || periodMonth
    })

    const filename = `raport_miesięczny_${restaurantName.replace(/\s+/g, '_')}_${periodMonth}.${format}`

    // Generate file
    if (format === 'csv') {
      const csv = generateCSV(exportData)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      })
    } else {
      // XLSX
      const buffer = generateXLSX(exportData, `Raport ${totals.monthName || periodMonth}`)

      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

  } catch (error) {
    console.error('❌ Monthly export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

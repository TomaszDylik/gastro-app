/**
 * ETAP 13: GET /api/reports/download/[id]
 *
 * Unified download endpoint for all report types
 * Generates fresh signed URL (7-day expiry)
 *
 * Query params:
 * - type: 'daily' | 'weekly' | 'monthly'
 *
 * Authorization: manager, owner, super_admin with access to restaurant
 *
 * Response: {
 *   downloadUrl: string
 *   expiresIn: string
 *   filename: string
 *   reportType: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { getSignedUrl } from '@/lib/storage'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'daily'
    const reportId = params.id

    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

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

    // 3. Fetch report based on type
    let report: any
    let restaurantId: string
    let filename: string

    if (reportType === 'daily') {
      const dailyReport = await prisma.reportDaily.findUnique({
        where: { id: reportId },
        include: { restaurant: true },
      })

      if (!dailyReport) {
        return NextResponse.json({ error: 'Daily report not found' }, { status: 404 })
      }

      report = dailyReport
      restaurantId = dailyReport.restaurantId
      filename = `daily-${dailyReport.date.toISOString().split('T')[0]}.json`
    } else if (reportType === 'weekly') {
      const weeklyReport = await prisma.reportWeekly.findUnique({
        where: { id: reportId },
        include: { restaurant: true },
      })

      if (!weeklyReport) {
        return NextResponse.json({ error: 'Weekly report not found' }, { status: 404 })
      }

      report = weeklyReport
      restaurantId = weeklyReport.restaurantId
      filename = `weekly-${weeklyReport.weekStart.toISOString().split('T')[0]}.json`
    } else {
      // monthly
      const monthlyReport = await prisma.reportMonthly.findUnique({
        where: { id: reportId },
        include: { restaurant: true },
      })

      if (!monthlyReport) {
        return NextResponse.json({ error: 'Monthly report not found' }, { status: 404 })
      }

      report = monthlyReport
      restaurantId = monthlyReport.restaurantId
      filename = `monthly-${monthlyReport.periodMonth.toISOString().split('T')[0]}.json`
    }

    // 4. Check permissions (manager, owner, super_admin)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId,
        status: 'active',
        role: {
          in: ['manager', 'owner', 'super_admin'],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this report' },
        { status: 403 },
      )
    }

    // 5. Generate storage path (same as export-to-storage)
    const filePath = `${restaurantId}/${filename}`

    // 6. Generate fresh signed URL
    const { url, error } = await getSignedUrl(filePath)

    if (error || !url) {
      // File might not exist in storage yet - return error
      return NextResponse.json(
        {
          error: 'Report file not found in storage',
          hint: 'Export the report first using /api/reports/export-to-storage',
        },
        { status: 404 },
      )
    }

    // 7. Log download to AuditLog
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        restaurantId,
        entityType: reportType === 'daily' ? 'ReportDaily' : reportType === 'weekly' ? 'ReportWeekly' : 'ReportMonthly',
        entityId: reportId,
        action: 'download_report',
        after: {
          filename,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      downloadUrl: url,
      expiresIn: '7 days',
      filename,
      reportType,
      reportId,
      storagePath: filePath,
    })
  } catch (error) {
    console.error('❌ Download report error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * POST /api/reports/daily/unsign
 * 
 * Unsign (revoke signature) from a daily report (manager/owner only)
 * 
 * Body: { reportId, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get user
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Parse request
    const body = await request.json()
    const { reportId, reason } = body

    if (!reportId) {
      return NextResponse.json(
        { error: 'Missing required field: reportId' },
        { status: 400 }
      )
    }

    // 4. Get report
    const report = await prisma.reportDaily.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // 5. Check permission
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        restaurantId: report.restaurantId,
        status: 'active',
        role: {
          in: ['owner', 'manager', 'super_admin']
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: Only managers and owners can unsign reports' },
        { status: 403 }
      )
    }

    // 6. Check if not signed
    if (!report.signedByUserId || !report.signedAt) {
      return NextResponse.json(
        { error: 'Report is not signed' },
        { status: 409 }
      )
    }

    // 7. Unsign report and log action
    const unsignEntry = {
      action: 'unsigned',
      byUserId: user.id,
      byUserName: user.name,
      at: new Date().toISOString(),
      reason: reason || 'No reason provided',
      previousSignedByUserId: report.signedByUserId,
      previousSignedAt: report.signedAt.toISOString()
    }

    const currentLog = Array.isArray(report.signatureLogJson) ? report.signatureLogJson as any[] : []

    const updatedReport = await prisma.reportDaily.update({
      where: { id: reportId },
      data: {
        signedByUserId: null,
        signedAt: null,
        signatureLogJson: [...currentLog, unsignEntry]
      }
    })

    // 8. Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        restaurantId: report.restaurantId,
        entityType: 'ReportDaily',
        entityId: reportId,
        action: 'unsign_report',
        before: {
          signedByUserId: report.signedByUserId,
          signedAt: report.signedAt.toISOString()
        },
        after: {
          signedByUserId: null,
          signedAt: null,
          reason
        }
      }
    })

    return NextResponse.json({
      report: {
        id: updatedReport.id,
        signedByUserId: updatedReport.signedByUserId,
        signedAt: updatedReport.signedAt,
        signatureLog: updatedReport.signatureLogJson
      }
    })

  } catch (error) {
    console.error('Error unsigning report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

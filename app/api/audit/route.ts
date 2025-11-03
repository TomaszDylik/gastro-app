/**
 * GET /api/audit
 * Pobiera audit logi (tylko dla Admin i Owner)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, canAccessAuditLogs } from '@/lib/audit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session/auth
    // For now, mock check - in production use actual auth
    const userRole = request.headers.get('x-user-role') || 'employee'
    
    if (!canAccessAuditLogs(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and owners can access audit logs' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const restaurantId = url.searchParams.get('restaurantId') || undefined
    const entityType = url.searchParams.get('entityType') || undefined
    const action = url.searchParams.get('action') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const result = await getAuditLogs({
      restaurantId,
      entityType,
      action,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

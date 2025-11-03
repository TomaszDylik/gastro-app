/**
 * ETAP 13: POST /api/storage/cleanup
 *
 * CRON job endpoint - usuwa pliki starsze niż 3 lata z Supabase Storage
 * Wywołanie: codziennie o 02:00 przez Supabase Edge Function lub GitHub Actions
 *
 * Authorization: Bearer <CRON_SECRET> w headerze
 *
 * Response: {
 *   deletedFiles: number
 *   deletedPaths: string[]
 *   retentionDays: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cleanupOldExports } from '@/lib/storage'

const prisma = new PrismaClient()

const RETENTION_DAYS = 3 * 365 // 3 years = 1095 days

export async function POST(request: NextRequest) {
  try {
    // 1. Verify CRON secret (security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.warn('⚠️ CRON_SECRET not configured - allowing cleanup anyway (dev mode)')
    } else {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid CRON secret' },
          { status: 401 },
        )
      }
    }

    console.log('🧹 Starting storage cleanup...')
    console.log(`📅 Retention policy: ${RETENTION_DAYS} days (3 years)`)

    // 2. Get all restaurants to clean their exports
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true },
    })

    let totalDeleted = 0
    const allDeletedPaths: string[] = []

    // 3. Cleanup exports for each restaurant
    for (const restaurant of restaurants) {
      console.log(`🔍 Cleaning exports for restaurant: ${restaurant.name} (${restaurant.id})`)

      const { deletedCount, deletedFiles } = await cleanupOldExports(restaurant.id)

      totalDeleted += deletedCount
      allDeletedPaths.push(...deletedFiles)

      if (deletedCount > 0) {
        console.log(`  ✅ Deleted ${deletedCount} old files`)
      } else {
        console.log(`  ℹ️ No old files to delete`)
      }
    }

    // 4. Log cleanup to AuditLog
    await prisma.auditLog.create({
      data: {
        actorUserId: 'system',
        entityType: 'Storage',
        entityId: 'cleanup-job',
        action: 'cleanup_old_exports',
        after: {
          deletedFiles: totalDeleted,
          retentionDays: RETENTION_DAYS,
          timestamp: new Date().toISOString(),
        },
      },
    })

    console.log(`✅ Cleanup complete: ${totalDeleted} files deleted`)

    return NextResponse.json(
      {
        success: true,
        deletedFiles: totalDeleted,
        deletedPaths: allDeletedPaths,
        retentionDays: RETENTION_DAYS,
        restaurantsProcessed: restaurants.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('❌ Storage cleanup error:', error)

    // Log error to AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: 'system',
          entityType: 'Storage',
          entityId: 'cleanup-job',
          action: 'cleanup_error',
          after: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (auditError) {
      console.error('❌ Failed to log cleanup error:', auditError)
    }

    return NextResponse.json(
      {
        error: 'Storage cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

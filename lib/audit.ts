/**
 * Audit Log Helper
 * Centralny system logowania wszystkich krytycznych operacji w systemie
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type AuditAction =
  | 'time_entry.create'
  | 'time_entry.edit'
  | 'time_entry.delete'
  | 'time_entry.approve'
  | 'time_entry.close_by_manager'
  | 'report_daily.generate'
  | 'report_daily.sign'
  | 'report_daily.unsign'
  | 'report_weekly.generate'
  | 'report_monthly.generate'
  | 'schedule.create'
  | 'schedule.update'
  | 'schedule.delete'
  | 'shift.create'
  | 'shift.assign'
  | 'membership.invite'
  | 'membership.remove'
  | 'membership.leave'

interface AuditLogParams {
  actorUserId: string
  restaurantId?: string
  entityType: string
  entityId: string
  action: AuditAction
  before?: any
  after?: any
}

/**
 * Zapisuje zdarzenie do audit logu
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        restaurantId: params.restaurantId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        before: params.before || null,
        after: params.after || null,
      },
    })
    return auditLog
  } catch (error) {
    // Nie przerywaj operacji jeśli audit log się nie zapisał
    console.error('Failed to create audit log:', error)
    return null
  }
}

/**
 * Pobiera audit logi dla restauracji
 */
export async function getAuditLogs(params: {
  restaurantId?: string
  limit?: number
  offset?: number
  entityType?: string
  action?: string
}) {
  const { restaurantId, limit = 100, offset = 0, entityType, action } = params

  const where: any = {}
  if (restaurantId) where.restaurantId = restaurantId
  if (entityType) where.entityType = entityType
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            authUserId: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    limit,
    offset,
  }
}

/**
 * Pobiera audit logi dla konkretnego entity
 */
export async function getEntityAuditHistory(entityType: string, entityId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          authUserId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return logs
}

/**
 * Sprawdza czy użytkownik ma dostęp do audit logów
 */
export function canAccessAuditLogs(userRole: string): boolean {
  return ['super_admin', 'owner'].includes(userRole)
}

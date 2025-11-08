import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// POST /api/manager/[restaurantId]/departments - Create new department
export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = params.restaurantId

    // Verify user is manager or owner of this restaurant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        restaurantId,
        role: { in: ['manager', 'owner'] },
        status: 'active',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - You must be a manager or owner' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, roleTag, color } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!roleTag || typeof roleTag !== 'string' || roleTag.trim().length === 0) {
      return NextResponse.json(
        { error: 'RoleTag is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Check if roleTag already exists for this restaurant
    const existingDepartment = await prisma.department.findUnique({
      where: {
        restaurantId_roleTag: {
          restaurantId,
          roleTag: roleTag.trim().toLowerCase(),
        },
      },
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this roleTag already exists' },
        { status: 409 }
      )
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        id: nanoid(),
        restaurantId,
        name: name.trim(),
        roleTag: roleTag.trim().toLowerCase(),
        color: color && typeof color === 'string' ? color : '#3B82F6',
        isActive: true,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Department creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/manager/[restaurantId]/departments - List all departments
export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = params.restaurantId

    // Verify user has access to this restaurant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        restaurantId,
        status: 'active',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this restaurant' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Fetch departments
    const departments = await prisma.department.findMany({
      where: {
        restaurantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            memberships: true,
            shifts: true,
          },
        },
      },
    })

    return NextResponse.json({
      departments,
      total: departments.length,
    })
  } catch (error) {
    console.error('Departments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

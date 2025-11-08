import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departmentId = params.id

    // Fetch department to verify restaurant access
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { restaurant: true },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Verify user is manager or owner of this restaurant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: existingDepartment.restaurantId,
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
    const { name, roleTag, color, isActive } = body

    // Build update data
    const updateData: any = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (roleTag !== undefined) {
      if (typeof roleTag !== 'string' || roleTag.trim().length === 0) {
        return NextResponse.json(
          { error: 'RoleTag must be a non-empty string' },
          { status: 400 }
        )
      }

      const normalizedRoleTag = roleTag.trim().toLowerCase()
      
      // Check if new roleTag conflicts with existing department
      if (normalizedRoleTag !== existingDepartment.roleTag) {
        const conflictingDepartment = await prisma.department.findUnique({
          where: {
            restaurantId_roleTag: {
              restaurantId: existingDepartment.restaurantId,
              roleTag: normalizedRoleTag,
            },
          },
        })

        if (conflictingDepartment) {
          return NextResponse.json(
            { error: 'Department with this roleTag already exists' },
            { status: 409 }
          )
        }
      }

      updateData.roleTag = normalizedRoleTag
    }

    if (color !== undefined) {
      if (typeof color !== 'string') {
        return NextResponse.json(
          { error: 'Color must be a string' },
          { status: 400 }
        )
      }
      updateData.color = color
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean' },
          { status: 400 }
        )
      }
      updateData.isActive = isActive
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: updateData,
    })

    return NextResponse.json(updatedDepartment)
  } catch (error) {
    console.error('Department update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department (soft delete by setting isActive=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departmentId = params.id

    // Fetch department to verify restaurant access
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            memberships: true,
            shifts: true,
          },
        },
      },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Verify user is manager or owner of this restaurant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        restaurantId: existingDepartment.restaurantId,
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

    // Check query param for hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - only if no memberships or shifts are assigned
      if (existingDepartment._count.memberships > 0 || existingDepartment._count.shifts > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot delete department with assigned members or shifts',
            memberships: existingDepartment._count.memberships,
            shifts: existingDepartment._count.shifts,
          },
          { status: 409 }
        )
      }

      await prisma.department.delete({
        where: { id: departmentId },
      })

      return NextResponse.json({ message: 'Department permanently deleted' })
    } else {
      // Soft delete - set isActive to false
      const updatedDepartment = await prisma.department.update({
        where: { id: departmentId },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Department deactivated',
        department: updatedDepartment,
      })
    }
  } catch (error) {
    console.error('Department delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

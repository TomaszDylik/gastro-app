import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/me/preferences
 *
 * Get user preferences (notifications, theme, etc.)
 */
export async function GET() {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user preferences
    const user = await prisma.appUser.findUnique({
      where: {
        authUserId: session.user.id,
      },
      select: {
        preferences: true,
        locale: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Return preferences with defaults
    const defaultPreferences = {
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      theme: 'light',
      language: user.locale || 'pl-PL',
    }

    const preferences = user.preferences
      ? { ...defaultPreferences, ...(user.preferences as object) }
      : defaultPreferences

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * PUT /api/users/me/preferences
 *
 * Update user preferences
 *
 * Body: { notifications?, theme?, language? }
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const body = await request.json()
    const { notifications, theme, language } = body

    // 3. Get current preferences
    const user = await prisma.appUser.findUnique({
      where: {
        authUserId: session.user.id,
      },
      select: {
        preferences: true,
        locale: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Merge with current preferences
    const currentPreferences = user.preferences as Record<string, any> || {}
    const newPreferences = {
      ...currentPreferences,
      ...(notifications !== undefined && { notifications }),
      ...(theme !== undefined && { theme }),
    }

    // 5. Update preferences (and locale if language changed)
    const updatedUser = await prisma.appUser.update({
      where: {
        authUserId: session.user.id,
      },
      data: {
        preferences: newPreferences,
        ...(language !== undefined && { locale: language }),
      },
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: {
        ...newPreferences,
        language: updatedUser.locale,
      },
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

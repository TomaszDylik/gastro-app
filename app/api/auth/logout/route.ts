import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Błąd wylogowania' }, { status: 500 })
  }
}

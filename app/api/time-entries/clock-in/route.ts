import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // TODO: Dodaj gdy będzie Prisma Client

export async function POST(request: Request) {
  try {
    const { membershipId, scheduleId } = await request.json()

    // TODO: Pobierz userId z sesji Supabase
    // const { data: { session } } = await supabase.auth.getSession()
    
    const now = new Date().toISOString()

    // TODO: Utwórz wpis w bazie
    // const timeEntry = await prisma.timeEntry.create({
    //   data: {
    //     membershipId,
    //     scheduleId,
    //     clockIn: now,
    //     clockOut: null,
    //     source: 'manual',
    //     adjustmentMinutes: 0
    //   }
    // })

    const mockEntry = {
      id: Math.random().toString(),
      membershipId,
      scheduleId,
      clockIn: now,
      clockOut: null,
      status: 'active'
    }

    return NextResponse.json({ success: true, entry: mockEntry })
  } catch (error) {
    console.error('Clock-in error:', error)
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 })
  }
}

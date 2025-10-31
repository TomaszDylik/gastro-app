import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const { entryId } = await request.json()

    const now = new Date().toISOString()

    // TODO: Zaktualizuj wpis w bazie
    // const timeEntry = await prisma.timeEntry.update({
    //   where: { id: entryId },
    //   data: {
    //     clockOut: now,
    //     // Status 'pending' - czeka na potwierdzenie managera
    //   }
    // })

    // Oblicz czas pracy w minutach
    // const minutes = differenceInMinutes(new Date(now), new Date(timeEntry.clockIn))

    const mockEntry = {
      id: entryId,
      clockOut: now,
      status: 'pending', // Oczekuje na zatwierdzenie
      totalMinutes: 120 // Mock - 2h
    }

    return NextResponse.json({ success: true, entry: mockEntry })
  } catch (error) {
    console.error('Clock-out error:', error)
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 })
  }
}

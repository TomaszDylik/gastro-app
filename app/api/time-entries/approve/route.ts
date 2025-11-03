import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { entryId, approved, reason } = await request.json()

    // TODO: Pobierz managera z sesji
    // const { data: { session } } = await supabase.auth.getSession()

    const now = new Date().toISOString()

    if (approved) {
      // TODO: Zatwierdź wpis
      // await prisma.timeEntry.update({
      //   where: { id: entryId },
      //   data: {
      //     approvedByUserId: session.user.id,
      //     approvedAt: now,
      //     status: 'approved'
      //   }
      // })

      // TODO: Utwórz rekord w PayrollMonthly (miesięczne zestawienie)

      return NextResponse.json({ success: true, message: 'Wpis zatwierdzony' })
    } else {
      // TODO: Odrzuć wpis
      // await prisma.timeEntry.update({
      //   where: { id: entryId },
      //   data: {
      //     status: 'rejected',
      //     reason: reason || null
      //   }
      // })

      return NextResponse.json({ success: true, message: 'Wpis odrzucony' })
    }
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}

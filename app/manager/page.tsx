import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function ManagerSelectRestaurantPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  try {
    const user = await prisma.appUser.findUnique({
      where: { authUserId: session.user.id },
      include: {
        memberships: {
          where: {
            status: 'active',
            role: 'manager',
          },
          include: {
            restaurant: true,
          },
        },
      },
    })

    if (!user) {
      redirect('/login')
    }

    const managerMemberships = user.memberships.filter((m) => m.role === 'manager')

    // Jeśli manager ma tylko jedną restaurację, przekieruj od razu
    if (managerMemberships.length === 1) {
      redirect(`/manager/${managerMemberships[0].restaurantId}/dashboard`)
    }

    // Jeśli brak restauracji
    if (managerMemberships.length === 0) {
      return (
        <main className="container mx-auto max-w-2xl p-6">
          <div className="rounded-lg bg-white p-8 shadow-md text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Brak restauracji</h1>
            <p className="text-gray-600 mb-6">
              Nie masz przypisanych żadnych restauracji jako manager.
            </p>
            <Link
              href="/employee/dashboard"
              className="inline-block rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Przejdź do panelu pracownika
            </Link>
          </div>
        </main>
      )
    }

    return (
      <main className="container mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Wybierz restaurację</h1>
          <p className="mt-2 text-gray-600">Wybierz restaurację, którą chcesz zarządzać</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {managerMemberships.map((membership) => (
            <Link
              key={membership.id}
              href={`/manager/${membership.restaurantId}/dashboard`}
              className="block rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
            >
              <div className="mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
                  🏪
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{membership.restaurant.name}</h2>
              <p className="mt-2 text-sm text-gray-500">Kliknij aby zarządzać</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/employee/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Powrót do panelu pracownika
          </Link>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error loading restaurants:', error)
    redirect('/login')
  } finally {
    await prisma.$disconnect()
  }
}

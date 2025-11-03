import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Supabase Admin client (do tworzenia użytkowników)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Utwórz restaurację
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'rest-podgrusza' },
    update: {},
    create: {
      id: 'rest-podgrusza',
      name: 'Pod Gruszą',
      timezone: 'Europe/Warsaw',
      settings: {
        create: {},
      },
    },
  })
  console.log('✅ Restaurant created:', restaurant.name)

  // 2. Utwórz użytkowników w Supabase Auth
  const managerEmail = 'manager@gmail.pl'
  const employee1Email = 'employee1@gmail.pl'
  const employee2Email = 'employee2@gmail.pl'
  const password = 'password'

  // Manager
  const { data: managerAuth, error: managerError } = await supabaseAdmin.auth.admin.createUser({
    email: managerEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Paweł Kowalski',
    },
  })

  if (managerError && !managerError.message.includes('already')) {
    throw managerError
  }
  console.log('✅ Manager auth user:', managerEmail)

  // Pracownik 1
  const { data: emp1Auth, error: emp1Error } = await supabaseAdmin.auth.admin.createUser({
    email: employee1Email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Anna Kowalska',
    },
  })

  if (emp1Error && !emp1Error.message.includes('already')) {
    throw emp1Error
  }
  console.log('✅ Employee 1 auth user:', employee1Email)

  // Pracownik 2
  const { data: emp2Auth, error: emp2Error } = await supabaseAdmin.auth.admin.createUser({
    email: employee2Email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Jan Nowak',
    },
  })

  if (emp2Error && !emp2Error.message.includes('already')) {
    throw emp2Error
  }
  console.log('✅ Employee 2 auth user:', employee2Email)

  // 3. Utwórz użytkowników w Prisma
  const managerUser = await prisma.appUser.upsert({
    where: { authUserId: managerAuth?.user?.id || 'manager-id' },
    update: {},
    create: {
      authUserId: managerAuth?.user?.id || 'manager-id',
      name: 'Paweł Kowalski',
      email: managerEmail,
      phone: '+48 600 100 200',
      hourlyRateDefaultPLN: '45.00',
    },
  })

  const emp1User = await prisma.appUser.upsert({
    where: { authUserId: emp1Auth?.user?.id || 'emp1-id' },
    update: {},
    create: {
      authUserId: emp1Auth?.user?.id || 'emp1-id',
      name: 'Anna Kowalska',
      email: employee1Email,
      phone: '+48 600 100 201',
      hourlyRateDefaultPLN: '35.00',
    },
  })

  const emp2User = await prisma.appUser.upsert({
    where: { authUserId: emp2Auth?.user?.id || 'emp2-id' },
    update: {},
    create: {
      authUserId: emp2Auth?.user?.id || 'emp2-id',
      name: 'Jan Nowak',
      email: employee2Email,
      phone: '+48 600 100 202',
      hourlyRateDefaultPLN: '40.00',
    },
  })

  console.log('✅ Users created in database')

  // 4. Utwórz membership (przypisanie do restauracji)
  await prisma.membership.create({
    data: {
      userId: managerUser.id,
      restaurantId: restaurant.id,
      role: 'manager',
      status: 'active',
      hourlyRateManagerPLN: '55.00', // Manager rate for this manager
    },
  })

  const emp1Membership = await prisma.membership.create({
    data: {
      userId: emp1User.id,
      restaurantId: restaurant.id,
      role: 'employee',
      status: 'active',
      // Uses hourlyRateDefaultPLN from AppUser (35.00)
    },
  })

  const emp2Membership = await prisma.membership.create({
    data: {
      userId: emp2User.id,
      restaurantId: restaurant.id,
      role: 'employee',
      status: 'active',
      // Uses hourlyRateDefaultPLN from AppUser (40.00)
    },
  })

  console.log('✅ Memberships created')

  // 5. Utwórz przykładowy grafik
  const schedule = await prisma.schedule.create({
    data: {
      name: 'Grafik Listopad 2025',
      restaurantId: restaurant.id,
    },
  })

  console.log('✅ Schedule created')

  // 6. Utwórz przykładowe zmiany (shifts)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const shift1 = await prisma.shift.create({
    data: {
      scheduleId: schedule.id,
      start: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
      end: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
      roleTag: 'Kelnerka',
    },
  })

  const shift2 = await prisma.shift.create({
    data: {
      scheduleId: schedule.id,
      start: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
      end: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
      roleTag: 'Kucharz',
    },
  })

  // 7. Przypisz pracowników do zmian
  await prisma.shiftAssignment.createMany({
    data: [
      {
        shiftId: shift1.id,
        membershipId: emp1Membership.id,
        status: 'assigned',
      },
      {
        shiftId: shift2.id,
        membershipId: emp2Membership.id,
        status: 'assigned',
      },
    ],
  })

  console.log('✅ Shifts and assignments created for today')

  console.log('\n🎉 Seed complete!')
  console.log('\n📧 Test accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Manager:')
  console.log(`  Email: ${managerEmail}`)
  console.log(`  Password: ${password}`)
  console.log('\nEmployee 1 (Anna):')
  console.log(`  Email: ${employee1Email}`)
  console.log(`  Password: ${password}`)
  console.log('\nEmployee 2 (Jan):')
  console.log(`  Email: ${employee2Email}`)
  console.log(`  Password: ${password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

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

  // 1. Utwórz firmę (Company) i restauracje
  const company = await prisma.company.upsert({
    where: { id: 'company-gastro' },
    update: {},
    create: {
      id: 'company-gastro',
      name: 'Gastro Group Sp. z o.o.',
    },
  })
  console.log('✅ Company created:', company.name)

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'rest-podgrusza' },
    update: {},
    create: {
      id: 'rest-podgrusza',
      name: 'Pod Gruszą',
      companyId: company.id,
      timezone: 'Europe/Warsaw',
      settings: {
        create: {},
      },
    },
  })
  console.log('✅ Restaurant 1 created:', restaurant.name)

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'rest-pizzeria' },
    update: {},
    create: {
      id: 'rest-pizzeria',
      name: 'Pizzeria Bella',
      companyId: company.id,
      timezone: 'Europe/Warsaw',
      settings: {
        create: {},
      },
    },
  })
  console.log('✅ Restaurant 2 created:', restaurant2.name)

  // 2. Utwórz użytkowników w Supabase Auth
  const adminEmail = 'admin@gastro.pl'
  const ownerEmail = 'owner@gastro.pl'
  const managerEmail = 'manager@gmail.pl'
  const employee1Email = 'employee1@gmail.pl'
  const employee2Email = 'employee2@gmail.pl'
  const password = 'password'

  // Admin (super_admin)
  const { data: adminAuth, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'System Admin',
    },
  })

  if (adminError && !adminError.message.includes('already')) {
    throw adminError
  }
  console.log('✅ Admin auth user:', adminEmail)

  // Owner
  const { data: ownerAuth, error: ownerError } = await supabaseAdmin.auth.admin.createUser({
    email: ownerEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: 'Maria Właścicielska',
    },
  })

  if (ownerError && !ownerError.message.includes('already')) {
    throw ownerError
  }
  console.log('✅ Owner auth user:', ownerEmail)

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
  const adminUser = await prisma.appUser.upsert({
    where: { authUserId: adminAuth?.user?.id || 'admin-id' },
    update: {},
    create: {
      authUserId: adminAuth?.user?.id || 'admin-id',
      name: 'System Admin',
      email: adminEmail,
      phone: '+48 500 000 001',
      hourlyRateDefaultPLN: '0.00',
    },
  })

  const ownerUser = await prisma.appUser.upsert({
    where: { authUserId: ownerAuth?.user?.id || 'owner-id' },
    update: {},
    create: {
      authUserId: ownerAuth?.user?.id || 'owner-id',
      name: 'Maria Właścicielska',
      email: ownerEmail,
      phone: '+48 500 000 002',
      hourlyRateDefaultPLN: '0.00',
    },
  })

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
  
  // Admin - super_admin role (dostęp do wszystkiego)
  await prisma.membership.create({
    data: {
      userId: adminUser.id,
      restaurantId: restaurant.id, // Przypisany do pierwszej restauracji
      role: 'super_admin',
      status: 'active',
    },
  })
  console.log('✅ Admin membership created')

  // Owner - owner role (właściciel obu restauracji)
  await prisma.membership.createMany({
    data: [
      {
        userId: ownerUser.id,
        restaurantId: restaurant.id,
        role: 'owner',
        status: 'active',
      },
      {
        userId: ownerUser.id,
        restaurantId: restaurant2.id,
        role: 'owner',
        status: 'active',
      },
    ],
  })
  console.log('✅ Owner memberships created (2 restaurants)')

  // Manager - manager role
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
  console.log('🔴 ADMIN (super_admin):')
  console.log(`  Email: ${adminEmail}`)
  console.log(`  Password: ${password}`)
  console.log(`  Access: /admin - full system access`)
  console.log('\n🟠 OWNER (owner):')
  console.log(`  Email: ${ownerEmail}`)
  console.log(`  Password: ${password}`)
  console.log(`  Access: /owner - manages 2 restaurants`)
  console.log('\n🟢 MANAGER (manager):')
  console.log(`  Email: ${managerEmail}`)
  console.log(`  Password: ${password}`)
  console.log(`  Access: /manager - manages "Pod Gruszą"`)
  console.log('\n🔵 EMPLOYEE 1 (employee - Anna):')
  console.log(`  Email: ${employee1Email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Access: /dashboard - employee features`)
  console.log('\n🔵 EMPLOYEE 2 (employee - Jan):')
  console.log(`  Email: ${employee2Email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Access: /dashboard - employee features`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 Data summary:')
  console.log('  • Company: Gastro Group Sp. z o.o.')
  console.log('  • Restaurants: Pod Gruszą, Pizzeria Bella')
  console.log('  • Users: 5 (1 admin, 1 owner, 1 manager, 2 employees)')
  console.log('  • Schedules: 1')
  console.log('  • Shifts: 2 (for today)\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

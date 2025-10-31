import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // przykładowe dane: 1 restauracja, 3 grafiki
  const rest = await prisma.restaurant.create({
    data: { name: 'Cafe Aurora', timezone: 'Europe/Warsaw', settings: { create: {} } }
  })

  // Użytkownicy (lokalne metadane — auth w Supabase)
  const superAdmin = await prisma.appUser.create({
    data: { authUserId: 'auth-super', name: 'Super Admin' }
  })
  const manager = await prisma.appUser.create({
    data: { authUserId: 'auth-manager', name: 'Marta Manager' }
  })
  const employee = await prisma.appUser.create({
    data: { authUserId: 'auth-employee', name: 'Eryk Employee' }
  })

  await prisma.membership.create({
    data: { userId: superAdmin.id, restaurantId: rest.id, role: 'super_admin', status: 'active' }
  })
  await prisma.membership.create({
    data: { userId: manager.id, restaurantId: rest.id, role: 'manager', status: 'active' }
  })
  await prisma.membership.create({
    data: { userId: employee.id, restaurantId: rest.id, role: 'employee', hourlyRatePLN: '32.00', status: 'active' }
  })

  for (const name of ['Sala', 'Bar', 'Kuchnia']) {
    await prisma.schedule.create({ data: { name, restaurantId: rest.id } })
  }

  console.log('Seed complete ✅')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 12),
      role: 'SUPER_ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.username)

  // Season
  const season = await prisma.season.upsert({
    where: { id: 'season-1' },
    update: {},
    create: {
      id: 'season-1',
      name: 'Season 1 - 2024',
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
    },
  })
  console.log('✅ Season created:', season.name)

  // Players
  const playersData = [
    { name: 'Rizki Pratama', shortName: 'Rzk', username: 'rizki_efb', city: 'Jakarta', description: 'Pemain dengan gaya ofensif kuat' },
    { name: 'Andi Saputra', shortName: 'And', username: 'andi_pro', city: 'Bandung', description: 'Ahli pertahanan' },
    { name: 'Dimas Wijaya', shortName: 'Dim', username: 'dimas_striker', city: 'Surabaya', description: 'Raja penguasaan bola' },
    { name: 'Fajar Nugroho', shortName: 'Fjr', username: 'fajar_mid', city: 'Semarang', description: 'Ahli tendangan jarak jauh' },
  ]

  const players = await Promise.all(
    playersData.map(data =>
      prisma.player.upsert({
        where: { username: data.username },
        update: {},
        create: data,
      })
    )
  )
  console.log('✅ Players created:', players.map(p => p.shortName).join(', '))

  // Sample Matches
  const matchesData = [
    { homePlayerId: players[0].id, awayPlayerId: players[1].id, scheduledAt: new Date('2024-01-15T19:00:00'), status: 'FINISHED' as const, homeScore: 3, awayScore: 1, playedAt: new Date('2024-01-15T19:00:00') },
    { homePlayerId: players[2].id, awayPlayerId: players[3].id, scheduledAt: new Date('2024-01-15T21:00:00'), status: 'FINISHED' as const, homeScore: 2, awayScore: 2, playedAt: new Date('2024-01-15T21:00:00') },
    { homePlayerId: players[1].id, awayPlayerId: players[2].id, scheduledAt: new Date('2024-01-22T19:00:00'), status: 'FINISHED' as const, homeScore: 0, awayScore: 1, playedAt: new Date('2024-01-22T19:00:00') },
    { homePlayerId: players[3].id, awayPlayerId: players[0].id, scheduledAt: new Date('2024-01-22T21:00:00'), status: 'FINISHED' as const, homeScore: 1, awayScore: 4, playedAt: new Date('2024-01-22T21:00:00') },
    { homePlayerId: players[0].id, awayPlayerId: players[2].id, scheduledAt: new Date('2024-02-05T19:00:00'), status: 'FINISHED' as const, homeScore: 2, awayScore: 0, playedAt: new Date('2024-02-05T19:00:00') },
    { homePlayerId: players[1].id, awayPlayerId: players[3].id, scheduledAt: new Date('2024-02-05T21:00:00'), status: 'FINISHED' as const, homeScore: 3, awayScore: 2, playedAt: new Date('2024-02-05T21:00:00') },
    // Upcoming
    { homePlayerId: players[2].id, awayPlayerId: players[0].id, scheduledAt: new Date('2024-12-15T19:00:00'), status: 'SCHEDULED' as const, homeScore: null, awayScore: null, playedAt: null },
    { homePlayerId: players[3].id, awayPlayerId: players[1].id, scheduledAt: new Date('2024-12-15T21:00:00'), status: 'SCHEDULED' as const, homeScore: null, awayScore: null, playedAt: null },
  ]

  const matches = await Promise.all(
    matchesData.map(data =>
      prisma.match.create({
        data: { ...data, seasonId: season.id },
      })
    )
  )
  console.log('✅ Matches created:', matches.length)



  console.log('\n🎉 Seed selesai!')
  console.log('📌 Login admin: username=admin, password=admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

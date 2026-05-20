import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    where: { status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
    select: { id: true, scheduledAt: true, homePlayerId: true, awayPlayerId: true }
  })
  console.log(JSON.stringify(matches, null, 2))
}

main().catch(console.error)

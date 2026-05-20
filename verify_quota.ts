import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      homePlayer: true,
      awayPlayer: true,
      season: true
    }
  })

  let scheduledCount = 0
  let finishedCount = 0

  const headToHead = new Map<string, number>()

  for (const match of matches) {
    if (match.status === 'SCHEDULED') scheduledCount++
    if (match.status === 'FINISHED') finishedCount++
    
    // Create a unique key for the pair, independent of who is home or away
    const p1 = match.homePlayerId
    const p2 = match.awayPlayerId
    const key = p1 < p2 ? `${match.homePlayer.name} vs ${match.awayPlayer.name}` : `${match.awayPlayer.name} vs ${match.homePlayer.name}`
    
    headToHead.set(key, (headToHead.get(key) || 0) + 1)
  }

  console.log(`=== LAPORAN KUOTA PERTANDINGAN ===`)
  console.log(`Total Match Keseluruhan: ${matches.length}`)
  console.log(`- MATCH FINISHED: ${finishedCount}`)
  console.log(`- MATCH SCHEDULED: ${scheduledCount}`)
  
  console.log(`\n=== JUMLAH PERTEMUAN (HEAD-TO-HEAD) ===`)
  for (const [pair, count] of Array.from(headToHead.entries())) {
    console.log(`${pair}: ${count} kali pertemuan`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

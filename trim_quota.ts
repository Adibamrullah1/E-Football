import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Menghitung dan memotong kuota match berlebih...')
  
  const matches = await prisma.match.findMany({
    orderBy: { scheduledAt: 'desc' }, // Ambil jadwal yang paling jauh/akhir untuk dihapus jika berlebih
    include: {
      homePlayer: true,
      awayPlayer: true,
    }
  })

  // Group matches by pair
  const headToHead = new Map<string, any[]>()
  let finishCountCheck = new Map<string, number>()

  for (const match of matches) {
    const p1 = match.homePlayerId
    const p2 = match.awayPlayerId
    const key = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`
    
    if (!headToHead.has(key)) headToHead.set(key, [])
    headToHead.get(key)!.push(match)

    if (match.status === 'FINISHED') {
        finishCountCheck.set(key, (finishCountCheck.get(key) || 0) + 1)
    }
  }

  let totalDeleted = 0
  const QUOTA = 15

  for (const [key, pairMatches] of Array.from(headToHead.entries())) {
    // Karena query orderBy desc, match paling ujung waktu ada di index awal.
    // Tetapi tenang, kita akan utamakan menghapus yang berstatus 'SCHEDULED' belakangan.
    // Mari pisahkan
    const scheduled = pairMatches.filter((m: any) => m.status === 'SCHEDULED')
    const finished = pairMatches.filter((m: any) => m.status === 'FINISHED')
    
    const totalCount = finished.length + scheduled.length

    if (totalCount > QUOTA) {
      let excess = totalCount - QUOTA
      // Kita hanya bisa hapus yang SCHEDULED.
      if (excess > scheduled.length) {
        console.warn(`WARNING: Exceeds quota but cannot delete FINISHED matches for pair ${key}. Will only delete scheduled.`)
        excess = scheduled.length
      }

      // Hapus sejumlah excess dari jadwal (kita ambil dari jadwal paling depan di array, yang merupakan jadwal paling akhir secara waktu karena kita orderBy desc)
      const toDelete = scheduled.slice(0, excess)
      for (const matchToDelete of toDelete) {
        await prisma.match.delete({ where: { id: matchToDelete.id } })
        totalDeleted++
      }
      
      const pName = `${pairMatches[0].homePlayer.name} vs ${pairMatches[0].awayPlayer.name}`
      console.log(`- Pair ${pName}: Menghapus ${excess} jadwal agar total menjadi 15.`)
    }
  }

  console.log(`\nSelesai! Berhasil menghapus ${totalDeleted} pertandingan SCHEDULED berlebihan.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

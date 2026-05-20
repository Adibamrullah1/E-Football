import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Validasi data dan Export Semua Pertandingan...')
  
  const matches = await prisma.match.findMany({
    include: {
      homePlayer: true,
      awayPlayer: true,
      season: true
    },
    orderBy: [
      { status: 'asc' },
      { scheduledAt: 'asc' }
    ]
  })

  // === Verifikasi Kuota ===
  const playerMatchCount = new Map<string, number>()
  const headToHeadCount = new Map<string, number>()

  for (const match of matches) {
    const hPlayer = match.homePlayer.name
    const aPlayer = match.awayPlayer.name

    // Hitung pertandingan per player
    playerMatchCount.set(hPlayer, (playerMatchCount.get(hPlayer) || 0) + 1)
    playerMatchCount.set(aPlayer, (playerMatchCount.get(aPlayer) || 0) + 1)

    // Hitung head to head
    const key = hPlayer < aPlayer ? `${hPlayer} vs ${aPlayer}` : `${aPlayer} vs ${hPlayer}`
    headToHeadCount.set(key, (headToHeadCount.get(key) || 0) + 1)
  }

  console.log('\n--- HASIL VERIFIKASI KUOTA ---')
  console.log(`Total Semua Pertandingan (Finished + Scheduled): ${matches.length}`)
  
  console.log('\n[TOTAL MATCH PER PLAYER]')
  let isPlayerQuotaValid = true
  for (const [player, count] of Array.from(playerMatchCount.entries())) {
    console.log(`- ${player}: ${count} Match`)
    if (count !== 60) isPlayerQuotaValid = false
  }

  console.log('\n[TOTAL PERTEMUAN ANTAR PLAYER (MAX 15)]')
  let isH2HQuotaValid = true
  for (const [pair, count] of Array.from(headToHeadCount.entries())) {
    console.log(`- ${pair}: ${count} kali pertemuan`)
    if (count !== 15) isH2HQuotaValid = false
  }

  console.log('\n--- STATUS VALIDASI ---')
  if (isPlayerQuotaValid && isH2HQuotaValid) {
    console.log('✅ KUOTA SUDAH PAS! (Semua player bermain 60 kali, maksimal bertemu 15 kali sesamanya)')
  } else {
    console.log('❌ KUOTA MASIH BELUM PAS! Ada ketidaksesuaian jumlah.')
  }

  // === Proses Export ===
  const headers = ['ID Pertandingan', 'Tanggal & Waktu', 'Musim', 'Player Home', 'Skor Home', 'Player Away', 'Skor Away', 'Status']
  const csvRows = [headers.join(',')]

  for (const match of matches) {
    const dateTime = new Date(match.scheduledAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    const seasonName = `"${match.season.name}"`
    const homeName = `"${match.homePlayer.name} (${match.homePlayer.shortName})"`
    const awayName = `"${match.awayPlayer.name} (${match.awayPlayer.shortName})"`
    const hScore = match.homeScore !== null ? match.homeScore : '-'
    const aScore = match.awayScore !== null ? match.awayScore : '-'
    
    csvRows.push([
      match.id,
      `"${dateTime}"`,
      seasonName,
      homeName,
      hScore,
      awayName,
      aScore,
      match.status
    ].join(','))
  }

  const csvContent = csvRows.join('\n')
  const filePath = path.join(process.cwd(), 'rekap_semua_match.csv')
  fs.writeFileSync(filePath, csvContent, 'utf-8')

  console.log(`\nBerhasil mengekspor ${matches.length} total pertandingan ke: ${filePath}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

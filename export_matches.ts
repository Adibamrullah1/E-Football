import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Mengambil data pertandingan yang belum selesai...')
  
  const matches = await prisma.match.findMany({
    where: { status: 'SCHEDULED' },
    include: {
      homePlayer: true,
      awayPlayer: true,
      season: true
    },
    orderBy: { scheduledAt: 'asc' }
  })

  if (matches.length === 0) {
    console.log('Tidak ada jadwal pertandingan (SCHEDULED) yang ditemukan.')
    return
  }

  // Membuat header CSV
  const headers = ['ID Pertandingan', 'Tanggal & Waktu', 'Musim', 'Player Home', 'Player Away', 'Status']
  const csvRows = [headers.join(',')]

  // Membuat array baris CSV
  for (const match of matches) {
    const dateTime = new Date(match.scheduledAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    const seasonName = `"${match.season.name}"`
    const homeName = `"${match.homePlayer.name} (${match.homePlayer.shortName})"`
    const awayName = `"${match.awayPlayer.name} (${match.awayPlayer.shortName})"`
    
    csvRows.push([
      match.id,
      `"${dateTime}"`,
      seasonName,
      homeName,
      awayName,
      match.status
    ].join(','))
  }

  const csvContent = csvRows.join('\n')
  
  const filePath = path.join(process.cwd(), 'jadwal_belum_selesai.csv')
  fs.writeFileSync(filePath, csvContent, 'utf-8')

  console.log(`Berhasil mengekspor ${matches.length} pertandingan ke file: ${filePath}`)
  console.log('Silahkan buka file .csv tersebut menggunakan Microsoft Excel.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

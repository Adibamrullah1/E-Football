import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fungsi pembantu untuk mendapatkan hari Jumat di minggu yang sama atau minggu berikutnya
function getNextFriday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day <= 5 ? 5 - day : 6 // Jika sebelum atau sama dengan Jumat, maju ke Jumat. Jika Sabtu, maju ke Jumat minggu depan
  d.setDate(d.getDate() + diff)
  d.setHours(19, 0, 0, 0)
  return d
}

function getNextSlot(date: Date) {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  
  // Tambah 30 menit
  nextDate.setMinutes(nextDate.getMinutes() + 30)
  
  const h = nextDate.getHours()
  const m = nextDate.getMinutes()
  
  // Batas toleransi akhir: 22:30. Jadi jika menunjuk jam 23:00, atau jam > 22 dengan menit > 30, kita lompat.
  const isPastLimit = h > 22 || (h === 22 && m > 30)

  if (day === 5) { // Jumat
    if (isPastLimit) {
      // Pindah ke Sabtu 08:00
      nextDate.setDate(nextDate.getDate() + 1)
      nextDate.setHours(8, 0, 0, 0)
    }
  } else if (day === 6) { // Sabtu
    if (isPastLimit) {
      // Pindah ke Minggu 08:00
      nextDate.setDate(nextDate.getDate() + 1)
      nextDate.setHours(8, 0, 0, 0)
    }
  } else if (day === 0) { // Minggu
    if (isPastLimit) {
      // Pindah ke Jumat Depan 19:00
      nextDate.setDate(nextDate.getDate() + 5)
      nextDate.setHours(19, 0, 0, 0)
    }
  }

  return nextDate
}

async function main() {
  console.log('Mencari semua pertandingan yang berstatus SCHEDULED...')
  const matches = await prisma.match.findMany({
    where: { status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
  })

  if (matches.length === 0) {
    console.log('Tidak ada pertandingan berstatus SCHEDULED yang ditemukan.')
    return
  }

  console.log(`Ditemukan ${matches.length} pertandingan. Memulai pembaruan jadwal...`)

  // Kita mulai dari hari Jumat yang paling dekat dengan pertandingan pertama
  let currentSlot = getNextFriday(matches[0].scheduledAt)
  
  // Jika schedule pertama adalah Sabtu atau Minggu dini hari misalnya,
  // getNextFriday di atas akan menempatkannya di Jumat *minggu itu* jika hari <= jumat, 
  // atau *jumat depannya* jika hari Sabtu/Minggu.
  // Untuk amannya, kita bisa mulai selalu dari NEXT Friday dari waktu sekarang, 
  // atau dari tgl match pertama. Kita pakai tgl match pertama yg dikonversi ke Jumat terdekat.
  
  let successCount = 0

  for (const match of matches) {
    const previousDateStr = match.scheduledAt.toLocaleString()
    const newDateStr = currentSlot.toLocaleString()
    
    console.log(`Update match ID ${match.id} | Ori: ${previousDateStr} => New: ${newDateStr}`)
    
    await prisma.match.update({
      where: { id: match.id },
      data: { scheduledAt: new Date(currentSlot) },
    })

    successCount++
    currentSlot = getNextSlot(currentSlot)
  }

  console.log(`\nSelesai! Berhasil mengupdate ${successCount} jadwal pertandingan.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

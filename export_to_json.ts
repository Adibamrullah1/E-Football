import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const dataDir = path.join(process.cwd(), 'data')
  
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (e) {}

  try {
    const seasons = await prisma.season.findMany()
    await fs.writeFile(path.join(dataDir, 'seasons.json'), JSON.stringify(seasons, null, 2))
    console.log(`Exported ${seasons.length} seasons.`)

    const players = await prisma.player.findMany()
    await fs.writeFile(path.join(dataDir, 'players.json'), JSON.stringify(players, null, 2))
    console.log(`Exported ${players.length} players.`)

    const matches = await prisma.match.findMany()
    await fs.writeFile(path.join(dataDir, 'matches.json'), JSON.stringify(matches, null, 2))
    console.log(`Exported ${matches.length} matches.`)

    const users = await prisma.user.findMany()
    await fs.writeFile(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2))
    console.log(`Exported ${users.length} users.`)

  } catch (err) {
    console.error("Failed to export. DB might be unreachable:", err)
    
    // Fallback: create empty arrays if error
    await fs.writeFile(path.join(dataDir, 'seasons.json'), '[]')
    await fs.writeFile(path.join(dataDir, 'players.json'), '[]')
    await fs.writeFile(path.join(dataDir, 'matches.json'), '[]')
    await fs.writeFile(path.join(dataDir, 'users.json'), '[]')
    console.log("Created empty JSON files as fallback.")
  } finally {
    await prisma.$disconnect()
  }
}

main()

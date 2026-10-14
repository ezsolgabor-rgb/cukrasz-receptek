import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Configure database connections
const localDbUrl = process.env.LOCAL_DATABASE_URL || 'file:./dev.db'
const neonDbUrl = process.env.DATABASE_URL || ''

// Local SQLite connection
const localPrisma = new PrismaClient()

// Neon PostgreSQL connection with adapter
const pool = new Pool({ connectionString: neonDbUrl })
const adapter = new PrismaPg(pool)
const neonPrisma = new PrismaClient({ adapter })

async function main() {
  console.log('Adatok átvitele a lokális adatbázisból a Neonba...')

  // Mértékegységek átvitele
  const units = await localPrisma.unit.findMany()
  await neonPrisma.unit.createMany({
    data: units,
    skipDuplicates: true
  })

  // Kategóriák átvitele
  const categories = await localPrisma.category.findMany()
  await neonPrisma.category.createMany({
    data: categories,
    skipDuplicates: true
  })

  // Beállítások átvitele
  const settings = await localPrisma.appSetting.findMany()
  await neonPrisma.appSetting.createMany({
    data: settings,
    skipDuplicates: true
  })

  // Receptek átvitele
  const recipes = await localPrisma.recipe.findMany({
    include: {
      ingredients: true,
      steps: true,
      photos: true,
      notesLog: true,
      tags: true
    }
  })
  for (const recipe of recipes) {
    await neonPrisma.recipe.create({
      data: {
        ...recipe,
        ingredients: {
          create: recipe.ingredients
        },
        steps: {
          create: recipe.steps
        },
        photos: {
          create: recipe.photos
        },
        notesLog: {
          create: recipe.notesLog
        },
        tags: {
          connect: recipe.tags.map(tag => ({ id: tag.id }))
        }
      }
    })
  }

  console.log('Adatok sikeresen át lettek másolva a Neon adatbázisba!')
}

main()
  .catch((e) => {
    console.error('Hiba történt az adatátvitel során:', e)
    process.exit(1)
  })
  .finally(async () => {
    await localPrisma.$disconnect()
    await neonPrisma.$disconnect()
  })

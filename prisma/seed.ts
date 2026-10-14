import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import Database from 'better-sqlite3'

// Configure Neon PostgreSQL connection with adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Adatok átvitele a lokális SQLite-ból a Neonba...')

  // Open SQLite connection - try multiple possible locations
  const dbPaths = [
    process.env.LOCAL_DATABASE_URL,
    './prisma/dev.db',
    './dev.db',
    '../prisma/dev.db',
    '../dev.db'
  ]
  
  let db
  for (const path of dbPaths) {
    if (!path) continue
    try {
      db = new Database(path)
      console.log(`SQLite adatbázis megnyitva: ${path}`)
      break
    } catch (e) {
      console.log(`Nem sikerült megnyitni: ${path}`)
    }
  }

  if (!db) {
    throw new Error('Nem található SQLite adatbázis fájl! Próbált helyek: ' + dbPaths.filter(p => p).join(', '))
  }

  try {
    // Transfer Units
    const units = db.prepare('SELECT * FROM Unit').all()
    await prisma.unit.createMany({
      data: units,
      skipDuplicates: true
    })

    // Transfer Categories
    const categories = db.prepare('SELECT * FROM Category').all()
    await prisma.category.createMany({
      data: categories,
      skipDuplicates: true
    })

    // Transfer Settings
    const settings = db.prepare('SELECT * FROM AppSetting').all()
    await prisma.appSetting.createMany({
      data: settings,
      skipDuplicates: true
    })

    // Transfer Recipes with related data
    const recipes = db.prepare('SELECT * FROM Recipe').all()
    for (const recipe of recipes) {
      const ingredients = db.prepare('SELECT * FROM RecipeIngredient WHERE recipeId = ?').all(recipe.id)
      const steps = db.prepare('SELECT * FROM RecipeStep WHERE recipeId = ?').all(recipe.id)
      const photos = db.prepare('SELECT * FROM RecipePhoto WHERE recipeId = ?').all(recipe.id)
      const notes = db.prepare('SELECT * FROM RecipeNote WHERE recipeId = ?').all(recipe.id)
      const tags = db.prepare('SELECT B FROM _RecipeTags WHERE A = ?').all(recipe.id)

      await prisma.recipe.create({
        data: {
          ...recipe,
          ingredients: { create: ingredients },
          steps: { create: steps },
          photos: { create: photos },
          notesLog: { create: notes },
          tags: { connect: tags.map(tag => ({ id: tag.B })) }
        }
      })
    }

    console.log('Adatok sikeresen át lettek másolva a Neon adatbázisba!')
  } catch (e) {
    console.error('Hiba történt az adatátvitel során:', e)
    process.exit(1)
  } finally {
    db.close()
    await prisma.$disconnect()
  }
}

main()

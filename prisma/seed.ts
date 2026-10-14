import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// Configure Neon PostgreSQL connection with adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Adatok átvitele a lokális SQLite-ból a Neonba...')

  // Open SQLite connection
  const db = await open({
    filename: process.env.LOCAL_DATABASE_URL || './dev.db',
    driver: sqlite3.Database
  })

  try {
    // Transfer Units
    const units = await db.all('SELECT * FROM Unit')
    await prisma.unit.createMany({
      data: units,
      skipDuplicates: true
    })

    // Transfer Categories
    const categories = await db.all('SELECT * FROM Category')
    await prisma.category.createMany({
      data: categories,
      skipDuplicates: true
    })

    // Transfer Settings
    const settings = await db.all('SELECT * FROM AppSetting')
    await prisma.appSetting.createMany({
      data: settings,
      skipDuplicates: true
    })

    // Transfer Recipes with related data
    const recipes = await db.all('SELECT * FROM Recipe')
    for (const recipe of recipes) {
      const [ingredients, steps, photos, notes, tags] = await Promise.all([
        db.all('SELECT * FROM RecipeIngredient WHERE recipeId = ?', recipe.id),
        db.all('SELECT * FROM RecipeStep WHERE recipeId = ?', recipe.id),
        db.all('SELECT * FROM RecipePhoto WHERE recipeId = ?', recipe.id),
        db.all('SELECT * FROM RecipeNote WHERE recipeId = ?', recipe.id),
        db.all('SELECT B FROM _RecipeTags WHERE A = ?', recipe.id)
      ])

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
    await db.close()
    await prisma.$disconnect()
  }
}

main()

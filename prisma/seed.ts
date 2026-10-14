import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Configure Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.SSL_CERT // Opcionális: ha egyedi SSL tanúsítványra van szükség
  }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Alapadatok feltöltése az éles Neon PostgreSQL adatbázisba...')

  // 1. Alapvető mértékegységek
  const units = [
    { code: 'g', name: 'gramm', dimension: 'mass', factorToBase: 1, decimals: 0, sortOrder: 10 },
    { code: 'kg', name: 'kilogramm', dimension: 'mass', factorToBase: 1000, decimals: 3, sortOrder: 20 },
    { code: 'ml', name: 'milliliter', dimension: 'volume', factorToBase: 1, decimals: 0, sortOrder: 30 },
    { code: 'l', name: 'liter', dimension: 'volume', factorToBase: 1000, decimals: 3, sortOrder: 40 },
    { code: 'db', name: 'darab', dimension: 'count', factorToBase: 1, decimals: 0, sortOrder: 50 },
    { code: 'szelet', name: 'szelet', dimension: 'count', factorToBase: 1, decimals: 0, sortOrder: 60 },
    { code: 'adag', name: 'adag', dimension: 'count', factorToBase: 1, decimals: 0, sortOrder: 70 },
    { code: 'tk', name: 'teáskanál', dimension: 'volume', factorToBase: 5, decimals: 1, sortOrder: 80 },
    { code: 'ek', name: 'evőkanál', dimension: 'volume', factorToBase: 15, decimals: 1, sortOrder: 90 }
  ]

  try {
    // 1. Mértékegységek létrehozása
    await prisma.unit.createMany({
      data: units,
      skipDuplicates: true
    })

    // 2. Alap kategóriák
    const categories = [
      { name: 'Torták', slug: 'tortak', color: '#C97B3C', sortOrder: 10 },
      { name: 'Sütemények', slug: 'sutemenyek', color: '#8A6E4B', sortOrder: 20 },
      { name: 'Krémes sütik', slug: 'kremes-sutik', color: '#D4A373', sortOrder: 30 },
      { name: 'Piskóták', slug: 'piskotak', color: '#F4A261', sortOrder: 40 }
    ]
    await prisma.category.createMany({
      data: categories,
      skipDuplicates: true
    })

    // 3. Tortaméretek
    const cakeSizes = [
      { diameterCm: 18, slices: 8, note: 'Kis méretű tortaformák' },
      { diameterCm: 24, slices: 12, note: 'Átlagos méret' },
      { diameterCm: 30, slices: 16, note: 'Nagyobb torták' }
    ]
    await prisma.cakeSize.createMany({
      data: cakeSizes,
      skipDuplicates: true
    })

    // 4. Alap beállítások
    await prisma.appSetting.createMany({
      data: [
        { key: 'shopName', value: 'Klau Cukrászda', label: 'Műhely neve' },
        { key: 'defaultUnit', value: 'g', label: 'Alapértelmezett mértékegység' }
      ],
      skipDuplicates: true
    })

    console.log('Alapadatok sikeresen feltöltve!')
  } catch (e) {
    console.error('Hiba történt az adatátvitel során:', e)
    process.exit(1)
  } catch (e) {
    console.error('Hiba történt az adatátvitel során:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

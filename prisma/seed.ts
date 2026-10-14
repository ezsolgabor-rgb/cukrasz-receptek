import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Alapértelmezett mértékegységek
  await prisma.unit.createMany({
    data: [
      { code: 'g', name: 'gramm', dimension: 'mass', factorToBase: 1 },
      { code: 'kg', name: 'kilogramm', dimension: 'mass', factorToBase: 1000 },
      { code: 'ml', name: 'milliliter', dimension: 'volume', factorToBase: 1 },
      { code: 'l', name: 'liter', dimension: 'volume', factorToBase: 1000 },
      { code: 'db', name: 'darab', dimension: 'count', factorToBase: 1 },
      { code: 'tk', name: 'teáskanál', dimension: 'volume', factorToBase: 5 },
      { code: 'ek', name: 'evőkanál', dimension: 'volume', factorToBase: 15 },
    ],
    skipDuplicates: true,
  })

  // Alapértelmezett kategóriák
  await prisma.category.createMany({
    data: [
      { name: 'Torták', slug: 'tortak', color: '#C97B3C' },
      { name: 'Sütemények', slug: 'sutemenyek', color: '#8A6E4B' },
      { name: 'Krémes sütik', slug: 'kremes-sutik', color: '#D4A373' },
      { name: 'Piskóták', slug: 'piskotak', color: '#F4A261' },
      { name: 'Kekszek', slug: 'kekszek', color: '#E76F51' },
    ],
    skipDuplicates: true,
  })

  // Alapértelmezett beállítások
  await prisma.appSetting.createMany({
    data: [
      { key: 'shopName', value: 'Klau Cukrászda', label: 'Műhely neve' },
      { key: 'defaultUnit', value: 'g', label: 'Alapértelmezett mértékegység' },
    ],
    skipDuplicates: true,
  })

  console.log('Alapértelmezett adatok sikeresen feltöltve!')
}

main()
  .catch((e) => {
    console.error('Hiba történt a seedelés során:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

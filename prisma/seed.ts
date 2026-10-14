import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Exportáljuk a lokális adatokat
  const recipes = await prisma.$queryRaw`SELECT * FROM "Recipe"`
  const categories = await prisma.$queryRaw`SELECT * FROM "Category"`
  // ... és így tovább minden táblához

  // Kapcsolódás a Neon adatbázishoz
  const neonPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_2iEqSGn4oWOj@ep-young-band-babvxrkl-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  })

  // Adatok importálása
  await neonPrisma.$executeRaw`INSERT INTO "Category" SELECT * FROM ${categories}`
  await neonPrisma.$executeRaw`INSERT INTO "Recipe" SELECT * FROM ${recipes}`
  // ... és így tovább minden táblához
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await neonPrisma.$disconnect()
  })

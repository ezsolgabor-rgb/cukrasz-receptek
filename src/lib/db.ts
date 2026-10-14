// Szerveroldali modul – kliens komponensből soha ne importáld.
// (A Prisma kliens node-only, a böngészőbe nem kerülhet be.)

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Fejlesztés közben a Next.js újratölti a modulokat; e nélkül minden
// újratöltés új adatbázis-kapcsolatot nyitna.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Szerveroldali modul – kliens komponensből soha ne importáld.
// (A Prisma kliens node-only, a böngészőbe nem kerülhet be.)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Fejlesztés közben a Next.js újratölti a modulokat; e nélkül minden
// újratöltés új adatbázis-kapcsolatot nyitna.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

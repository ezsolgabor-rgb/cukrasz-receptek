// Szerveroldali modul – kliens komponensből soha ne importáld.
// (A Prisma kliens node-only, a böngészőbe nem kerülhet be.)

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../../generated/prisma/client.ts";

// A Prisma 7 driver-adaptert használ. A SQLite fájl útvonala a .env-ből jön,
// így a felhőbe költözéskor csak a connection string és az adapter cserélődik.
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
  });
}

// Fejlesztés közben a Next.js újratölti a modulokat; e nélkül minden
// újratöltés új adatbázis-kapcsolatot nyitna.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

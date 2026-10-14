import { defineConfig } from '@prisma/config'
import 'dotenv/config'

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
    localDb: {
      url: process.env.LOCAL_DATABASE_URL || 'file:./dev.db'
    }
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})

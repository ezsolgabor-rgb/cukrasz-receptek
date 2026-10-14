import { defineConfig } from '@prisma/client'
import 'dotenv/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

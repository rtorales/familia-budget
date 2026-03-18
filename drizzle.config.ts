import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:QEWVxtpOfqBRIZQCwgQnAFFpnEnxemkv@shortline.proxy.rlwy.net:16504/railway',
  },
} satisfies Config

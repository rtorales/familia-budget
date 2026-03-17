import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

function createPrismaClient() {
  const dbPath = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  // Convert Prisma file URL to libsql format
  const libsqlUrl = dbPath.startsWith('file:')
    ? `file:${path.resolve(dbPath.replace('file:', ''))}`
    : dbPath

  const libsql = createClient({ url: libsqlUrl })
  const adapter = new PrismaLibSql(libsql)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any)
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

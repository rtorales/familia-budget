import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categoria } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function GET() {
  const { user, error } = await requireSession()
  if (error) return error

  const categorias = await db.select().from(categoria)
    .where(eq(categoria.familiaId, user.familiaId))
    .orderBy(desc(categoria.esSistema), categoria.nombre)
  return NextResponse.json(categorias)
}

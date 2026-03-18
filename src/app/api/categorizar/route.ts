import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categoria } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { categorizarGasto } from '@/lib/categorizacion'
import { requireSession } from '@/lib/session'

export async function POST(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { descripcion } = await req.json()
  const categorias = await db.select().from(categoria).where(eq(categoria.familiaId, user.familiaId))
  const resultado = categorizarGasto(descripcion, categorias)
  return NextResponse.json(resultado)
}

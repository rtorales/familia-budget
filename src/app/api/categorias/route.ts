import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categoria } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const categorias = db.select().from(categoria).orderBy(desc(categoria.esSistema), categoria.nombre).all()
  return NextResponse.json(categorias)
}

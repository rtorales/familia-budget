import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categoria } from '@/lib/db/schema'
import { categorizarGasto } from '@/lib/categorizacion'

export async function POST(req: Request) {
  const { descripcion } = await req.json()
  const categorias = db.select().from(categoria).all()
  const resultado = categorizarGasto(descripcion, categorias)
  return NextResponse.json(resultado)
}

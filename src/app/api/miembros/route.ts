import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembro } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const miembros = db.select().from(miembro).where(eq(miembro.activo, true)).all()
  return NextResponse.json(miembros)
}

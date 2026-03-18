import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembro } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function GET() {
  const { user, error } = await requireSession()
  if (error) return error

  const miembros = db.select().from(miembro)
    .where(and(eq(miembro.familiaId, user.familiaId), eq(miembro.activo, true)))
    .all()
  return NextResponse.json(miembros)
}

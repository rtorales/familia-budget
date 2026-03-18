import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembro } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  // Verify the miembro belongs to the user's family
  const [existing] = await db.select({ id: miembro.id })
    .from(miembro)
    .where(and(eq(miembro.id, params.id), eq(miembro.familiaId, user.familiaId)))
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  const body = await req.json()
  const { nombre, color } = body
  await db.update(miembro).set({ nombre, color }).where(eq(miembro.id, params.id))
  const [updated] = await db.select().from(miembro).where(eq(miembro.id, params.id))
  return NextResponse.json(updated)
}

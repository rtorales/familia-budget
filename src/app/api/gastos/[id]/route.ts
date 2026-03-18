import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, miembro } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  // Verify the gasto belongs to the user's family
  const [existing] = await db.select({ id: gasto.id })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(gasto.id, params.id), eq(miembro.familiaId, user.familiaId)))
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  await db.delete(gasto).where(eq(gasto.id, params.id))
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  // Verify the gasto belongs to the user's family
  const [existing] = await db.select({ id: gasto.id })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(gasto.id, params.id), eq(miembro.familiaId, user.familiaId)))
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  const body = await req.json()
  await db.update(gasto).set({ ...body, fecha: new Date(body.fecha), actualizadoEn: new Date() }).where(eq(gasto.id, params.id))
  const [updated] = await db.select().from(gasto).where(eq(gasto.id, params.id))
  return NextResponse.json(updated)
}

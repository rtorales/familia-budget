import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, miembro } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

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

// PATCH: partial update — mainly used to toggle estado EJECUTADO ↔ PROYECTADO
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  const [existing] = await db.select({ id: gasto.id })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(gasto.id, params.id), eq(miembro.familiaId, user.familiaId)))
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  const body = await req.json()
  const allowed: Record<string, unknown> = { actualizadoEn: new Date() }
  if (body.estado !== undefined) allowed.estado = body.estado
  if (body.fecha !== undefined) allowed.fecha = new Date(body.fecha)
  if (body.monto !== undefined) allowed.monto = body.monto
  if (body.descripcion !== undefined) allowed.descripcion = body.descripcion
  if (body.notas !== undefined) allowed.notas = body.notas

  await db.update(gasto).set(allowed).where(eq(gasto.id, params.id))
  const [updated] = await db.select().from(gasto).where(eq(gasto.id, params.id))
  return NextResponse.json(updated)
}

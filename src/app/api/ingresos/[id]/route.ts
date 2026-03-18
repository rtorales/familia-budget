import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingreso, miembro } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  // Verify the ingreso belongs to the user's family
  const [existing] = db.select({ id: ingreso.id })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(and(eq(ingreso.id, params.id), eq(miembro.familiaId, user.familiaId)))
    .all()
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  db.delete(ingreso).where(eq(ingreso.id, params.id)).run()
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  // Verify the ingreso belongs to the user's family
  const [existing] = db.select({ id: ingreso.id })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(and(eq(ingreso.id, params.id), eq(miembro.familiaId, user.familiaId)))
    .all()
  if (!existing) return NextResponse.json({ error: 'No encontrado o no autorizado' }, { status: 404 })

  const body = await req.json()
  db.update(ingreso).set({ ...body, fecha: new Date(body.fecha), actualizadoEn: new Date() }).where(eq(ingreso.id, params.id)).run()
  const [updated] = db.select().from(ingreso).where(eq(ingreso.id, params.id)).all()
  return NextResponse.json(updated)
}

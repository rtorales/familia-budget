import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  db.delete(gasto).where(eq(gasto.id, params.id)).run()
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  db.update(gasto).set({ ...body, fecha: new Date(body.fecha), actualizadoEn: new Date() }).where(eq(gasto.id, params.id)).run()
  const [updated] = db.select().from(gasto).where(eq(gasto.id, params.id)).all()
  return NextResponse.json(updated)
}

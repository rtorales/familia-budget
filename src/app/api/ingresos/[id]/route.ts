import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingreso } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  db.delete(ingreso).where(eq(ingreso.id, params.id)).run()
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  db.update(ingreso).set({ ...body, fecha: new Date(body.fecha), actualizadoEn: new Date() }).where(eq(ingreso.id, params.id)).run()
  const [updated] = db.select().from(ingreso).where(eq(ingreso.id, params.id)).all()
  return NextResponse.json(updated)
}

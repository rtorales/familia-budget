import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembro } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { nombre, color } = body
  db.update(miembro).set({ nombre, color }).where(eq(miembro.id, params.id)).run()
  const [updated] = db.select().from(miembro).where(eq(miembro.id, params.id)).all()
  return NextResponse.json(updated)
}

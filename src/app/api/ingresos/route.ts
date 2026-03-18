import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingreso, miembro } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { requireSession } from '@/lib/session'

const IngresoSchema = z.object({
  miembroId: z.string(),
  concepto: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string(),
  esRecurrente: z.boolean().default(false),
  notas: z.string().optional(),
})

export async function GET(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : null
  const miembroId = searchParams.get('miembroId')

  const conditions = [eq(miembro.familiaId, user.familiaId)]

  if (mes && anio) {
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59)
    conditions.push(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin))
  }
  if (miembroId) conditions.push(eq(ingreso.miembroId, miembroId))

  const ingresos = await db.select({
    id: ingreso.id,
    miembroId: ingreso.miembroId,
    concepto: ingreso.concepto,
    monto: ingreso.monto,
    fecha: ingreso.fecha,
    esRecurrente: ingreso.esRecurrente,
    notas: ingreso.notas,
    creadoEn: ingreso.creadoEn,
    miembro: { id: miembro.id, nombre: miembro.nombre, color: miembro.color },
  })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(and(...conditions))
    .orderBy(desc(ingreso.fecha))

  return NextResponse.json(ingresos)
}

export async function POST(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  try {
    const body = await req.json()
    const data = IngresoSchema.parse(body)

    // Verify the miembro belongs to this family
    const [mem] = await db.select().from(miembro)
      .where(and(eq(miembro.id, data.miembroId), eq(miembro.familiaId, user.familiaId)))
    if (!mem) return NextResponse.json({ error: 'Miembro no válido' }, { status: 403 })

    const id = createId()
    await db.insert(ingreso).values({
      id, ...data,
      fecha: new Date(data.fecha),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    })

    const [created] = await db.select().from(ingreso).where(eq(ingreso.id, id))
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

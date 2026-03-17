import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ingreso, miembro } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'

const IngresoSchema = z.object({
  miembroId: z.string(),
  concepto: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string(),
  esRecurrente: z.boolean().default(false),
  notas: z.string().optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : null
  const miembroId = searchParams.get('miembroId')

  const conditions = []

  if (mes && anio) {
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59)
    conditions.push(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin))
  }
  if (miembroId) conditions.push(eq(ingreso.miembroId, miembroId))

  const ingresos = db.select({
    id: ingreso.id,
    miembroId: ingreso.miembroId,
    concepto: ingreso.concepto,
    monto: ingreso.monto,
    fecha: ingreso.fecha,
    esRecurrente: ingreso.esRecurrente,
    notas: ingreso.notas,
    creadoEn: ingreso.creadoEn,
    miembro: {
      id: miembro.id,
      nombre: miembro.nombre,
      color: miembro.color,
    }
  })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ingreso.fecha))
    .all()

  return NextResponse.json(ingresos)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = IngresoSchema.parse(body)

    const id = createId()
    db.insert(ingreso).values({
      id,
      ...data,
      fecha: new Date(data.fecha),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    }).run()

    const [created] = db.select().from(ingreso).where(eq(ingreso.id, id)).all()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

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

  const ingresosDB = await db.select({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultado: any[] = ingresosDB.map(i => ({ ...i, virtual: false }))

  // Para meses futuros (hasta dic 2026), proyectar ingresos recurrentes
  const now = new Date()
  const currentYM = now.getFullYear() * 12 + now.getMonth()
  const targetYM = anio && mes ? anio * 12 + (mes - 1) : null
  const esMesFuturo = targetYM !== null && targetYM > currentYM
  const MAX_ANIO = 2026

  if (esMesFuturo && anio && anio <= MAX_ANIO) {
    // Obtener todos los ingresos recurrentes de los últimos 3 meses
    const tresAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recurrentes = await db.select({
      id: ingreso.id,
      miembroId: ingreso.miembroId,
      concepto: ingreso.concepto,
      monto: ingreso.monto,
      esRecurrente: ingreso.esRecurrente,
      creadoEn: ingreso.creadoEn,
      miembro: { id: miembro.id, nombre: miembro.nombre, color: miembro.color },
    })
      .from(ingreso)
      .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
      .where(and(
        eq(miembro.familiaId, user.familiaId),
        eq(ingreso.esRecurrente, true),
        gte(ingreso.fecha, tresAtras),
      ))
      .orderBy(desc(ingreso.fecha))

    // Tomar el más reciente por miembro+concepto (deduplicar)
    const seen = new Set<string>()
    for (const rec of recurrentes) {
      const key = `${rec.miembroId}-${rec.concepto}`
      if (seen.has(key)) continue
      seen.add(key)
      if (miembroId && rec.miembroId !== miembroId) continue

      resultado.push({
        ...rec,
        id: `virtual-ing-${rec.id}-${mes}-${anio}`,
        fecha: new Date(anio, mes! - 1, 5),
        virtual: true,
      })
    }
  }

  return NextResponse.json(resultado)
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

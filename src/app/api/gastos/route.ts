import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, cuota, miembro, categoria } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { categorizarGasto } from '@/lib/categorizacion'

const CuotaSchema = z.object({
  concepto: z.string(),
  montoTotal: z.number(),
  montoCuota: z.number(),
  cuotaActual: z.number().int(),
  totalCuotas: z.number().int(),
  fechaInicio: z.string(),
  fechaProximaCuota: z.string(),
  frecuencia: z.string().default('MENSUAL'),
  notas: z.string().optional(),
})

const GastoSchema = z.object({
  miembroId: z.string(),
  categoriaId: z.string().optional(),
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  fecha: z.string(),
  tipo: z.enum(['CASUAL', 'CUOTA']).default('CASUAL'),
  notas: z.string().optional(),
  cuota: CuotaSchema.optional(),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : null
  const miembroId = searchParams.get('miembroId')
  const categoriaId = searchParams.get('categoriaId')
  const tipo = searchParams.get('tipo')

  const conditions = []
  if (mes && anio) {
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59)
    conditions.push(gte(gasto.fecha, inicio), lte(gasto.fecha, fin))
  }
  if (miembroId) conditions.push(eq(gasto.miembroId, miembroId))
  if (categoriaId) conditions.push(eq(gasto.categoriaId, categoriaId))
  if (tipo) conditions.push(eq(gasto.tipo, tipo))

  const gastos = db.select({
    id: gasto.id,
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    fecha: gasto.fecha,
    tipo: gasto.tipo,
    categorizacionAuto: gasto.categorizacionAuto,
    confianzaCategoria: gasto.confianzaCategoria,
    notas: gasto.notas,
    creadoEn: gasto.creadoEn,
    miembro: { id: miembro.id, nombre: miembro.nombre, color: miembro.color },
    categoria: { id: categoria.id, nombre: categoria.nombre, icono: categoria.icono, color: categoria.color },
  })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(gasto.fecha))
    .all()

  return NextResponse.json(gastos)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = GastoSchema.parse(body)

    // Auto-categorize if no category provided
    let categoriaId = data.categoriaId
    let categorizacionAuto = false
    let confianzaCategoria: number | null = null

    if (!categoriaId) {
      const cats = db.select().from(categoria).all()
      const resultado = categorizarGasto(data.descripcion, cats)
      if (resultado) {
        categoriaId = resultado.categoriaId
        categorizacionAuto = true
        confianzaCategoria = resultado.confianza
      } else {
        const fallback = cats.find(c => c.nombre === 'Hogar') ?? cats[0]
        categoriaId = fallback.id
      }
    }

    const gastoId = createId()
    db.insert(gasto).values({
      id: gastoId,
      miembroId: data.miembroId,
      categoriaId: categoriaId!,
      descripcion: data.descripcion,
      monto: data.monto,
      fecha: new Date(data.fecha),
      tipo: data.tipo,
      notas: data.notas ?? null,
      categorizacionAuto,
      confianzaCategoria,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    }).run()

    if (data.tipo === 'CUOTA' && data.cuota) {
      db.insert(cuota).values({
        id: createId(),
        gastoId,
        concepto: data.cuota.concepto,
        montoTotal: data.cuota.montoTotal,
        montoCuota: data.cuota.montoCuota,
        cuotaActual: data.cuota.cuotaActual,
        totalCuotas: data.cuota.totalCuotas,
        cuotasRestantes: data.cuota.totalCuotas - data.cuota.cuotaActual,
        fechaInicio: new Date(data.cuota.fechaInicio),
        fechaProximaCuota: new Date(data.cuota.fechaProximaCuota),
        frecuencia: data.cuota.frecuencia,
        activa: true,
        notas: data.cuota.notas ?? null,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      }).run()
    }

    const [created] = db.select().from(gasto).where(eq(gasto.id, gastoId)).all()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, cuota, miembro, categoria } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { categorizarGasto } from '@/lib/categorizacion'
import { requireSession } from '@/lib/session'

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
  estado: z.enum(['EJECUTADO', 'PROYECTADO']).default('EJECUTADO'),
  notas: z.string().optional(),
  cuota: CuotaSchema.optional(),
})

export async function GET(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : null
  const miembroId = searchParams.get('miembroId')
  const categoriaId = searchParams.get('categoriaId')
  const tipo = searchParams.get('tipo')
  const estado = searchParams.get('estado') // 'EJECUTADO' | 'PROYECTADO' | null (all)

  const conditions = [eq(miembro.familiaId, user.familiaId)]
  if (mes && anio) {
    conditions.push(gte(gasto.fecha, new Date(anio, mes - 1, 1)))
    conditions.push(lte(gasto.fecha, new Date(anio, mes, 0, 23, 59, 59)))
  }
  if (miembroId) conditions.push(eq(gasto.miembroId, miembroId))
  if (categoriaId) conditions.push(eq(gasto.categoriaId, categoriaId))
  if (tipo) conditions.push(eq(gasto.tipo, tipo))
  if (estado) conditions.push(eq(gasto.estado, estado))

  const gastosDB = await db.select({
    id: gasto.id,
    descripcion: gasto.descripcion,
    monto: gasto.monto,
    fecha: gasto.fecha,
    tipo: gasto.tipo,
    estado: gasto.estado,
    categorizacionAuto: gasto.categorizacionAuto,
    confianzaCategoria: gasto.confianzaCategoria,
    notas: gasto.notas,
    creadoEn: gasto.creadoEn,
    miembro: { id: miembro.id, nombre: miembro.nombre, color: miembro.color },
    categoria: { id: categoria.id, nombre: categoria.nombre, icono: categoria.icono, color: categoria.color, esSaving: categoria.esSaving },
  })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .where(and(...conditions))
    .orderBy(desc(gasto.fecha))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultado: any[] = gastosDB.map(g => ({ ...g, virtual: false }))

  // Para meses futuros, generar registros proyectados virtuales desde cuotas activas
  const now = new Date()
  const currentYM = now.getFullYear() * 12 + now.getMonth()
  const targetYM = anio && mes ? anio * 12 + (mes - 1) : null
  const esMesFuturo = targetYM !== null && targetYM > currentYM

  if (esMesFuturo && estado !== 'EJECUTADO') {
    const cuotasActivas = await db.select({
      id: cuota.id,
      concepto: cuota.concepto,
      montoCuota: cuota.montoCuota,
      cuotaActual: cuota.cuotaActual,
      totalCuotas: cuota.totalCuotas,
      fechaProximaCuota: cuota.fechaProximaCuota,
      miembroId: miembro.id,
      miembroNombre: miembro.nombre,
      miembroColor: miembro.color,
      categoriaId: categoria.id,
      categoriaNombre: categoria.nombre,
      categoriaIcono: categoria.icono,
      categoriaColor: categoria.color,
      esSaving: categoria.esSaving,
    })
      .from(cuota)
      .innerJoin(gasto, eq(cuota.gastoId, gasto.id))
      .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
      .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
      .where(and(eq(cuota.activa, true), eq(miembro.familiaId, user.familiaId)))

    for (const c of cuotasActivas) {
      if (miembroId && c.miembroId !== miembroId) continue
      const fpd = new Date(c.fechaProximaCuota)
      const fpdYM = fpd.getFullYear() * 12 + fpd.getMonth()
      const monthsDiff = targetYM! - fpdYM
      if (monthsDiff < 0) continue
      const cuotaInMonth = (c.cuotaActual + 1) + monthsDiff
      if (cuotaInMonth > c.totalCuotas) continue

      resultado.push({
        id: `virtual-cuota-${c.id}-${mes}-${anio}`,
        descripcion: `${c.concepto} (${cuotaInMonth}/${c.totalCuotas})`,
        monto: c.montoCuota,
        fecha: new Date(anio!, mes! - 1, fpd.getDate()),
        tipo: 'CUOTA',
        estado: 'PROYECTADO',
        categorizacionAuto: false,
        confianzaCategoria: null,
        notas: null,
        creadoEn: new Date(),
        virtual: true,
        miembro: { id: c.miembroId, nombre: c.miembroNombre, color: c.miembroColor },
        categoria: { id: c.categoriaId, nombre: c.categoriaNombre, icono: c.categoriaIcono, color: c.categoriaColor, esSaving: c.esSaving },
      })
    }

    resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  return NextResponse.json(resultado)
}

export async function POST(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  try {
    const body = await req.json()
    const data = GastoSchema.parse(body)

    // Verify member belongs to this family
    const [mem] = await db.select().from(miembro)
      .where(and(eq(miembro.id, data.miembroId), eq(miembro.familiaId, user.familiaId)))
    if (!mem) return NextResponse.json({ error: 'Miembro no válido' }, { status: 403 })

    let categoriaId = data.categoriaId
    let categorizacionAuto = false
    let confianzaCategoria: number | null = null

    if (!categoriaId) {
      const cats = await db.select().from(categoria).where(eq(categoria.familiaId, user.familiaId))
      const resultado = categorizarGasto(data.descripcion, cats)
      if (resultado) {
        categoriaId = resultado.categoriaId
        categorizacionAuto = true
        confianzaCategoria = resultado.confianza
      } else {
        const fallback = cats.find(c => c.nombre === 'Hogar') ?? cats[0]
        categoriaId = fallback?.id
      }
    }

    if (!categoriaId) return NextResponse.json({ error: 'No se encontró categoría' }, { status: 400 })

    const gastoId = createId()
    await db.insert(gasto).values({
      id: gastoId,
      miembroId: data.miembroId,
      categoriaId,
      descripcion: data.descripcion,
      monto: data.monto,
      fecha: new Date(data.fecha),
      tipo: data.tipo,
      estado: data.estado,
      notas: data.notas ?? null,
      categorizacionAuto,
      confianzaCategoria,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    })

    if (data.tipo === 'CUOTA' && data.cuota) {
      await db.insert(cuota).values({
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
      })
    }

    const [created] = await db.select().from(gasto).where(eq(gasto.id, gastoId))
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { presupuesto, categoria } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { requireSession } from '@/lib/session'

const PresupuestoSchema = z.object({
  categoriaId: z.string(),
  monto: z.number().positive(),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int(),
  alertaAlPct: z.number().min(0).max(1).default(0.80),
})

export async function GET(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : new Date().getMonth() + 1
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!) : new Date().getFullYear()

  const presupuestos = db.select({
    id: presupuesto.id,
    categoriaId: presupuesto.categoriaId,
    monto: presupuesto.monto,
    mes: presupuesto.mes,
    anio: presupuesto.anio,
    alertaAlPct: presupuesto.alertaAlPct,
    categoria: { id: categoria.id, nombre: categoria.nombre, icono: categoria.icono, color: categoria.color },
  })
    .from(presupuesto)
    .innerJoin(categoria, eq(presupuesto.categoriaId, categoria.id))
    .where(and(eq(presupuesto.mes, mes), eq(presupuesto.anio, anio), eq(presupuesto.familiaId, user.familiaId)))
    .all()

  return NextResponse.json(presupuestos)
}

export async function POST(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  try {
    const body = await req.json()
    const data = PresupuestoSchema.parse(body)

    const id = createId()
    db.insert(presupuesto).values({ id, ...data, familiaId: user.familiaId, creadoEn: new Date(), actualizadoEn: new Date() })
      .onConflictDoUpdate({
        target: [presupuesto.categoriaId, presupuesto.mes, presupuesto.anio],
        set: { monto: data.monto, alertaAlPct: data.alertaAlPct, actualizadoEn: new Date() }
      }).run()

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

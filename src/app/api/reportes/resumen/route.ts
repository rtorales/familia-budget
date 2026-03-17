import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, ingreso, cuota, categoria } from '@/lib/db/schema'
import { eq, and, gte, lte, sum } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))

  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 0, 23, 59, 59)

  // Total ingresos
  const [ingresoResult] = db.select({ total: sum(ingreso.monto) })
    .from(ingreso)
    .where(and(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin)))
    .all()
  const totalIngresos = Number(ingresoResult?.total ?? 0)

  // Total gastos
  const [gastoResult] = db.select({ total: sum(gasto.monto) })
    .from(gasto)
    .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin)))
    .all()
  const totalGastos = Number(gastoResult?.total ?? 0)

  // Cuotas activas
  const cuotasActivas = db.select().from(cuota).where(eq(cuota.activa, true)).all().length

  // Gastos por categoria
  const porCategoria = db.select({
    categoriaId: gasto.categoriaId,
    nombre: categoria.nombre,
    icono: categoria.icono,
    color: categoria.color,
    total: sum(gasto.monto),
  })
    .from(gasto)
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin)))
    .groupBy(gasto.categoriaId)
    .all()

  const gastosPorCategoria = porCategoria.map(pc => ({
    ...pc,
    total: Number(pc.total ?? 0),
    porcentaje: totalGastos > 0 ? Number(pc.total ?? 0) / totalGastos : 0,
  }))

  return NextResponse.json({
    mes, anio, totalIngresos, totalGastos,
    balance: totalIngresos - totalGastos,
    cuotasActivas,
    gastosPorCategoria,
  })
}

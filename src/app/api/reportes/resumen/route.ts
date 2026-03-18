import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, ingreso, cuota, categoria, miembro } from '@/lib/db/schema'
import { eq, and, gte, lte, sum } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function GET(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))

  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 0, 23, 59, 59)

  // Total ingresos (filtered by family)
  const [ingresoResult] = await db.select({ total: sum(ingreso.monto) })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(and(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin), eq(miembro.familiaId, user.familiaId)))
  const totalIngresos = Number(ingresoResult?.total ?? 0)

  // Total gastos (filtered by family)
  const [gastoResult] = await db.select({ total: sum(gasto.monto) })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin), eq(miembro.familiaId, user.familiaId)))
  const totalGastos = Number(gastoResult?.total ?? 0)

  // Cuotas activas (filtered by family via gasto→miembro)
  const cuotasActivasRows = await db.select({ id: cuota.id })
    .from(cuota)
    .innerJoin(gasto, eq(cuota.gastoId, gasto.id))
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(cuota.activa, true), eq(miembro.familiaId, user.familiaId)))
  const cuotasActivas = cuotasActivasRows.length

  // Gastos por categoria (filtered by family)
  const porCategoria = await db.select({
    categoriaId: gasto.categoriaId,
    nombre: categoria.nombre,
    icono: categoria.icono,
    color: categoria.color,
    total: sum(gasto.monto),
  })
    .from(gasto)
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin), eq(miembro.familiaId, user.familiaId)))
    .groupBy(gasto.categoriaId, categoria.nombre, categoria.icono, categoria.color)

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

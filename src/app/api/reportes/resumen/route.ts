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

  // Total ingresos
  const [ingresoResult] = await db.select({ total: sum(ingreso.monto) })
    .from(ingreso)
    .innerJoin(miembro, eq(ingreso.miembroId, miembro.id))
    .where(and(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin), eq(miembro.familiaId, user.familiaId)))
  const totalIngresos = Number(ingresoResult?.total ?? 0)

  // Fetch all gastos for the period with category info to split into buckets
  const gastosRows = await db.select({
    monto: gasto.monto,
    estado: gasto.estado,
    esSaving: categoria.esSaving,
  })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin), eq(miembro.familiaId, user.familiaId)))

  // Split into buckets
  let totalGastos = 0      // EJECUTADO, NOT saving → operativo
  let totalAhorros = 0     // EJECUTADO, IS saving → inversiones/ahorros
  let totalProyectado = 0  // PROYECTADO (any category)

  for (const row of gastosRows) {
    if (row.estado === 'PROYECTADO') {
      totalProyectado += row.monto
    } else if (row.esSaving) {
      totalAhorros += row.monto
    } else {
      totalGastos += row.monto
    }
  }

  // Saldo líquido = ingresos - gastos operativos ejecutados (ahorros are separate)
  const saldoLiquido = totalIngresos - totalGastos - totalAhorros

  // Cuotas activas
  const cuotasActivasRows = await db.select({ id: cuota.id })
    .from(cuota)
    .innerJoin(gasto, eq(cuota.gastoId, gasto.id))
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(cuota.activa, true), eq(miembro.familiaId, user.familiaId)))
  const cuotasActivas = cuotasActivasRows.length

  // Gastos por categoria — only EJECUTADO, non-saving gastos
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
    .where(and(
      gte(gasto.fecha, inicio),
      lte(gasto.fecha, fin),
      eq(miembro.familiaId, user.familiaId),
      eq(gasto.estado, 'EJECUTADO'),
      eq(categoria.esSaving, false),
    ))
    .groupBy(gasto.categoriaId, categoria.nombre, categoria.icono, categoria.color)

  const gastosPorCategoria = porCategoria.map(pc => ({
    ...pc,
    total: Number(pc.total ?? 0),
    porcentaje: totalGastos > 0 ? Number(pc.total ?? 0) / totalGastos : 0,
  }))

  return NextResponse.json({
    mes, anio,
    totalIngresos,
    totalGastos,        // operativos ejecutados
    totalAhorros,       // en inversiones/fondos
    totalProyectado,    // comprometidos pendientes
    saldoLiquido,       // ingresos - gastos - ahorros
    balance: saldoLiquido, // kept for backward compat
    cuotasActivas,
    gastosPorCategoria,
  })
}

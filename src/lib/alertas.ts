import { db } from './db'
import { gasto, presupuesto, categoria } from './db/schema'
import { eq, and, gte, lte, sum } from 'drizzle-orm'

export interface AlertaPresupuesto {
  categoriaId: string
  categoriaNombre: string
  categoriaIcono: string
  presupuesto: number
  gastado: number
  porcentaje: number
  nivel: 'advertencia' | 'critico'
}

export async function calcularAlertas(mes: number, anio: number): Promise<AlertaPresupuesto[]> {
  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 0, 23, 59, 59)

  const presupuestos = db.select({
    id: presupuesto.id,
    categoriaId: presupuesto.categoriaId,
    monto: presupuesto.monto,
    alertaAlPct: presupuesto.alertaAlPct,
    nombre: categoria.nombre,
    icono: categoria.icono,
  })
    .from(presupuesto)
    .innerJoin(categoria, eq(presupuesto.categoriaId, categoria.id))
    .where(and(eq(presupuesto.mes, mes), eq(presupuesto.anio, anio)))
    .all()

  const alertas: AlertaPresupuesto[] = []

  for (const p of presupuestos) {
    const [resultado] = db.select({ total: sum(gasto.monto) })
      .from(gasto)
      .where(and(
        eq(gasto.categoriaId, p.categoriaId),
        gte(gasto.fecha, inicio),
        lte(gasto.fecha, fin),
      ))
      .all()

    const totalGastado = Number(resultado?.total ?? 0)
    const porcentaje = totalGastado / p.monto

    if (porcentaje >= p.alertaAlPct) {
      alertas.push({
        categoriaId: p.categoriaId,
        categoriaNombre: p.nombre,
        categoriaIcono: p.icono,
        presupuesto: p.monto,
        gastado: totalGastado,
        porcentaje,
        nivel: porcentaje >= 1.0 ? 'critico' : 'advertencia',
      })
    }
  }

  return alertas
}

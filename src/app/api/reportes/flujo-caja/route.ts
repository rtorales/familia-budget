import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gasto, ingreso } from '@/lib/db/schema'
import { and, gte, lte, sum } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mesesAtras = parseInt(searchParams.get('meses') ?? '6')

  const datos = []
  const hoy = new Date()

  for (let i = mesesAtras - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59)

    const [ing] = db.select({ total: sum(ingreso.monto) }).from(ingreso)
      .where(and(gte(ingreso.fecha, inicio), lte(ingreso.fecha, fin))).all()
    const [gas] = db.select({ total: sum(gasto.monto) }).from(gasto)
      .where(and(gte(gasto.fecha, inicio), lte(gasto.fecha, fin))).all()

    const totalIngresos = Number(ing?.total ?? 0)
    const totalGastos = Number(gas?.total ?? 0)

    datos.push({
      mes: fecha.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance: totalIngresos - totalGastos,
    })
  }

  return NextResponse.json(datos)
}

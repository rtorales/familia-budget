import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cuota, gasto, miembro, categoria } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const cuotas = db.select({
    id: cuota.id,
    concepto: cuota.concepto,
    montoTotal: cuota.montoTotal,
    montoCuota: cuota.montoCuota,
    cuotaActual: cuota.cuotaActual,
    totalCuotas: cuota.totalCuotas,
    cuotasRestantes: cuota.cuotasRestantes,
    fechaInicio: cuota.fechaInicio,
    fechaProximaCuota: cuota.fechaProximaCuota,
    frecuencia: cuota.frecuencia,
    activa: cuota.activa,
    notas: cuota.notas,
    gastoId: cuota.gastoId,
    miembro: { id: miembro.id, nombre: miembro.nombre, color: miembro.color },
    categoria: { id: categoria.id, nombre: categoria.nombre, icono: categoria.icono },
  })
    .from(cuota)
    .innerJoin(gasto, eq(cuota.gastoId, gasto.id))
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .innerJoin(categoria, eq(gasto.categoriaId, categoria.id))
    .where(eq(cuota.activa, true))
    .all()

  return NextResponse.json(cuotas)
}

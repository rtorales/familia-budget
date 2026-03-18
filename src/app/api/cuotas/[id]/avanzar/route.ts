import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cuota, gasto, miembro } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { requireSession } from '@/lib/session'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireSession()
  if (error) return error

  const [existingCuota] = await db.select().from(cuota).where(eq(cuota.id, params.id))
  if (!existingCuota) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })

  // Verify cuota belongs to user's family via gasto→miembro→familiaId
  const [parentGasto] = await db.select({ id: gasto.id, miembroId: gasto.miembroId, categoriaId: gasto.categoriaId })
    .from(gasto)
    .innerJoin(miembro, eq(gasto.miembroId, miembro.id))
    .where(and(eq(gasto.id, existingCuota.gastoId), eq(miembro.familiaId, user.familiaId)))

  if (!parentGasto) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const nuevaCuotaActual = existingCuota.cuotaActual + 1
  const terminada = nuevaCuotaActual >= existingCuota.totalCuotas

  const nuevaFecha = new Date(existingCuota.fechaProximaCuota)
  nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)

  await db.update(cuota).set({
    cuotaActual: nuevaCuotaActual,
    cuotasRestantes: existingCuota.totalCuotas - nuevaCuotaActual,
    fechaProximaCuota: nuevaFecha,
    activa: !terminada,
    actualizadoEn: new Date(),
  }).where(eq(cuota.id, params.id))

  if (!terminada) {
    await db.insert(gasto).values({
      id: createId(),
      miembroId: parentGasto.miembroId,
      categoriaId: parentGasto.categoriaId,
      descripcion: `${existingCuota.concepto} - Cuota ${nuevaCuotaActual}/${existingCuota.totalCuotas}`,
      monto: existingCuota.montoCuota,
      fecha: new Date(),
      tipo: 'CASUAL',
      notas: 'Pago registrado automáticamente',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    })
  }

  return NextResponse.json({ ok: true, terminada, cuotaActual: nuevaCuotaActual })
}

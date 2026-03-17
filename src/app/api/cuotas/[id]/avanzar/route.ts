import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cuota, gasto } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const [existingCuota] = db.select().from(cuota).where(eq(cuota.id, params.id)).all()
  if (!existingCuota) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })

  const [parentGasto] = db.select().from(gasto).where(eq(gasto.id, existingCuota.gastoId)).all()

  const nuevaCuotaActual = existingCuota.cuotaActual + 1
  const terminada = nuevaCuotaActual >= existingCuota.totalCuotas

  const nuevaFecha = new Date(existingCuota.fechaProximaCuota)
  nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)

  db.update(cuota).set({
    cuotaActual: nuevaCuotaActual,
    cuotasRestantes: existingCuota.totalCuotas - nuevaCuotaActual,
    fechaProximaCuota: nuevaFecha,
    activa: !terminada,
    actualizadoEn: new Date(),
  }).where(eq(cuota.id, params.id)).run()

  if (!terminada) {
    db.insert(gasto).values({
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
    }).run()
  }

  return NextResponse.json({ ok: true, terminada, cuotaActual: nuevaCuotaActual })
}

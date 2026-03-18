import { NextResponse } from 'next/server'
import { calcularAlertas } from '@/lib/alertas'
import { requireSession } from '@/lib/session'

export async function GET(req: Request) {
  const { user, error } = await requireSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))
  const alertas = await calcularAlertas(mes, anio, user.familiaId)
  return NextResponse.json(alertas)
}

import { NextResponse } from 'next/server'
import { calcularAlertas } from '@/lib/alertas'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()))
  const alertas = await calcularAlertas(mes, anio)
  return NextResponse.json(alertas)
}

'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/lib/formatters'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface CuotaRow {
  id: string
  concepto: string
  montoTotal: number
  montoCuota: number
  cuotaActual: number
  totalCuotas: number
  cuotasRestantes: number
  fechaInicio: string
  fechaProximaCuota: string
  frecuencia: string
  activa: boolean
  notas: string | null
  miembro: { nombre: string; color: string }
  categoria: { nombre: string; icono: string }
}

export default function CuotasContent() {
  const { data: cuotas, mutate } = useSWR('/api/cuotas', fetcher)
  const [procesando, setProcesando] = useState<string | null>(null)

  const handleAvanzar = async (id: string) => {
    if (!confirm('¿Registrar el pago de esta cuota y avanzar al siguiente mes?')) return
    setProcesando(id)
    try {
      const res = await fetch(`/api/cuotas/${id}/avanzar`, { method: 'POST' })
      const data = await res.json()
      if (data.terminada) {
        alert('¡Plan de cuotas completado!')
      }
      mutate()
    } finally {
      setProcesando(null)
    }
  }

  const totalMensual = (cuotas ?? []).reduce((s: number, c: CuotaRow) => s + c.montoCuota, 0)
  const totalRestante = (cuotas ?? []).reduce((s: number, c: CuotaRow) => s + (c.cuotasRestantes * c.montoCuota), 0)

  if (!cuotas) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32 border border-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Planes activos</p>
          <p className="text-2xl font-bold text-orange-600">{cuotas.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Compromiso mensual</p>
          <p className="text-2xl font-bold text-orange-600">{formatearMoneda(totalMensual)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Deuda total restante</p>
          <p className="text-2xl font-bold text-red-600">{formatearMoneda(totalRestante)}</p>
        </div>
      </div>

      {/* Cuotas list */}
      <div className="space-y-4">
        {cuotas.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Sin planes de cuotas activos</p>
            <p className="text-sm text-gray-400 mt-1">Agregá un gasto en cuotas desde la sección Gastos</p>
          </div>
        )}
        {cuotas.map((c: CuotaRow) => {
          const progresoPct = (c.cuotaActual / c.totalCuotas) * 100
          const mesesRestantes = c.cuotasRestantes
          const esCritico = mesesRestantes <= 2
          const esProximo = new Date(c.fechaProximaCuota) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{c.categoria.icono}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.concepto}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.miembro.color }} />
                      <span className="text-sm text-gray-500">{c.miembro.nombre}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{c.categoria.nombre}</span>
                    </div>
                    {c.notas && <p className="text-xs text-gray-400 mt-1">{c.notas}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{formatearMoneda(c.montoCuota)}<span className="text-sm font-normal text-gray-500">/mes</span></p>
                  <p className="text-xs text-gray-400">Total: {formatearMoneda(c.montoTotal)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Cuota {c.cuotaActual} de {c.totalCuotas}</span>
                  <span>{Math.round(progresoPct)}% completado</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-orange-400"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Próximo: {formatearFecha(c.fechaProximaCuota)}
                    {esProximo && <AlertCircle className="w-3.5 h-3.5 text-orange-500 ml-0.5" />}
                  </span>
                  <span>Restantes: {mesesRestantes} cuotas ({formatearMoneda(c.cuotasRestantes * c.montoCuota)})</span>
                </div>
                <button
                  onClick={() => handleAvanzar(c.id)}
                  disabled={procesando === c.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    esCritico
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  } disabled:opacity-50`}
                >
                  {procesando === c.id ? 'Procesando...' : 'Registrar pago'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

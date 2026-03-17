'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Filter } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/lib/formatters'
import IngresoFormModal from './IngresoFormModal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface IngresoRow {
  id: string
  concepto: string
  monto: number
  fecha: string
  esRecurrente: boolean
  notas: string | null
  miembro: { nombre: string; color: string }
}

interface MiembroOption {
  id: string
  nombre: string
}

export default function IngresosContent() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [miembroFiltro, setMiembroFiltro] = useState('')
  const [showModal, setShowModal] = useState(false)

  const params = new URLSearchParams({ mes: String(mes), anio: String(anio) })
  if (miembroFiltro) params.set('miembroId', miembroFiltro)

  const { data: ingresos, mutate } = useSWR(`/api/ingresos?${params}`, fetcher)
  const { data: miembros } = useSWR('/api/miembros', fetcher)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' })
    mutate()
  }

  const totalIngresos = (ingresos ?? []).reduce((s: number, i: IngresoRow) => s + i.monto, 0)

  return (
    <div className="space-y-4">
      {/* Filters + Add button */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          value={mes}
          onChange={e => setMes(+e.target.value)}
        >
          {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          value={anio}
          onChange={e => setAnio(+e.target.value)}
        >
          {[anio - 1, anio, anio + 1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {miembros && (
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            value={miembroFiltro}
            onChange={e => setMiembroFiltro(e.target.value)}
          >
            <option value="">Todos los miembros</option>
            {miembros.map((m: MiembroOption) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Summary card */}
      {ingresos && ingresos.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-medium">Total ingresos del período</p>
            <p className="text-2xl font-bold text-green-700">{formatearMoneda(totalIngresos)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600">{ingresos.length} registros</p>
          </div>
        </div>
      )}

      {/* Income list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Concepto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Miembro</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Recurrente</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Monto</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(ingresos ?? []).map((i: IngresoRow) => (
                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{i.concepto}</p>
                      {i.notas && <p className="text-xs text-gray-400">{i.notas}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: i.miembro.color }} />
                      {i.miembro.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{formatearFecha(i.fecha)}</td>
                  <td className="px-6 py-3">
                    {i.esRecurrente ? (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Fijo</span>
                    ) : (
                      <span className="text-xs text-gray-400">Eventual</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600 text-sm">{formatearMoneda(i.monto)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {(!ingresos || ingresos.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8 text-sm">Sin ingresos en este período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <IngresoFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); mutate() }}
        />
      )}
    </div>
  )
}

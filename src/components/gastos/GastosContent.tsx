'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Filter } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/lib/formatters'
import GastoFormModal from './GastoFormModal'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface GastoRow {
  id: string
  tipo: string
  categoria: { icono: string; nombre: string; color: string }
  descripcion: string
  categorizacionAuto: boolean
  miembro: { nombre: string; color: string }
  fecha: string
  monto: number
}

interface MiembroOption {
  id: string
  nombre: string
}

export default function GastosContent() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [miembroFiltro, setMiembroFiltro] = useState('')
  const [showModal, setShowModal] = useState(false)

  const params = new URLSearchParams({ mes: String(mes), anio: String(anio) })
  if (miembroFiltro) params.set('miembroId', miembroFiltro)

  const { data: gastos, mutate } = useSWR(`/api/gastos?${params}`, fetcher)
  const { data: miembros } = useSWR('/api/miembros', fetcher)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    mutate()
  }

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
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Descripción</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Categoría</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Miembro</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Fecha</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Monto</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(gastos ?? []).map((g: GastoRow) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {g.tipo === 'CUOTA' && <span className="text-xs">🔄</span>}
                      <span className="text-sm text-gray-800">{g.descripcion}</span>
                      {g.categorizacionAuto && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Auto</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>{g.categoria.icono}</span>
                      {g.categoria.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: g.miembro.color }} />
                      {g.miembro.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{formatearFecha(g.fecha)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-red-600 text-sm">{formatearMoneda(g.monto)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {(!gastos || gastos.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8 text-sm">Sin gastos en este período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {gastos && gastos.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">{gastos.length} gastos</span>
            <span className="text-sm font-semibold text-gray-700">
              Total: {formatearMoneda(gastos.reduce((s: number, g: GastoRow) => s + g.monto, 0))}
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <GastoFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); mutate() }}
        />
      )}
    </div>
  )
}

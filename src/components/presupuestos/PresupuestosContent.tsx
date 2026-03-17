'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Edit2, X, Check } from 'lucide-react'
import { formatearMoneda, formatearMesAnio } from '@/lib/formatters'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface PresupuestoRow {
  id: string
  categoriaId: string
  monto: number
  mes: number
  anio: number
  alertaAlPct: number
  categoria: { id: string; nombre: string; icono: string; color: string }
}

interface GastosPorCat {
  categoriaId: string
  total: number
}

interface CategoriaOption {
  id: string
  icono: string
  nombre: string
}

export default function PresupuestosContent() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [editando, setEditando] = useState<string | null>(null)
  const [editMonto, setEditMonto] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCatId, setNewCatId] = useState('')
  const [newMonto, setNewMonto] = useState('')

  const { data: presupuestos, mutate } = useSWR(`/api/presupuestos?mes=${mes}&anio=${anio}`, fetcher)
  const { data: resumen } = useSWR(`/api/reportes/resumen?mes=${mes}&anio=${anio}`, fetcher)
  const { data: categorias } = useSWR('/api/categorias', fetcher)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const getGastadoParaCategoria = (categoriaId: string): number => {
    if (!resumen?.gastosPorCategoria) return 0
    const found = resumen.gastosPorCategoria.find((g: GastosPorCat) => g.categoriaId === categoriaId)
    return found?.total ?? 0
  }

  const handleEditar = (p: PresupuestoRow) => {
    setEditando(p.id)
    setEditMonto(String(p.monto))
  }

  const handleGuardarEdicion = async (p: PresupuestoRow) => {
    await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoriaId: p.categoriaId,
        monto: parseFloat(editMonto),
        mes,
        anio,
        alertaAlPct: p.alertaAlPct,
      }),
    })
    setEditando(null)
    mutate()
  }

  const handleAgregar = async () => {
    if (!newCatId || !newMonto) return
    await fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoriaId: newCatId,
        monto: parseFloat(newMonto),
        mes,
        anio,
        alertaAlPct: 0.8,
      }),
    })
    setShowAddForm(false)
    setNewCatId('')
    setNewMonto('')
    mutate()
  }

  const totalPresupuestado = (presupuestos ?? []).reduce((s: number, p: PresupuestoRow) => s + p.monto, 0)
  const totalGastado = (presupuestos ?? []).reduce((s: number, p: PresupuestoRow) => s + getGastadoParaCategoria(p.categoriaId), 0)

  const categoriasDisponibles = (categorias ?? []).filter((c: CategoriaOption) => {
    return !(presupuestos ?? []).some((p: PresupuestoRow) => p.categoriaId === c.id)
  })

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-600 font-medium">Período:</span>
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
        <span className="text-sm text-gray-500 capitalize">{formatearMesAnio(mes, anio)}</span>
        <div className="ml-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar presupuesto
          </button>
        </div>
      </div>

      {/* Summary */}
      {presupuestos && presupuestos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
            <p className="text-sm text-gray-500">Total presupuestado</p>
            <p className="text-xl font-bold text-indigo-600">{formatearMoneda(totalPresupuestado)}</p>
          </div>
          <div className={`bg-white rounded-xl p-4 border shadow-sm ${totalGastado > totalPresupuestado ? 'border-red-100' : 'border-green-100'}`}>
            <p className="text-sm text-gray-500">Total gastado</p>
            <p className={`text-xl font-bold ${totalGastado > totalPresupuestado ? 'text-red-600' : 'text-green-600'}`}>
              {formatearMoneda(totalGastado)}
            </p>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">Nuevo límite de presupuesto</h3>
          <div className="flex gap-3 flex-wrap">
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white flex-1 min-w-40"
              value={newCatId}
              onChange={e => setNewCatId(e.target.value)}
            >
              <option value="">Seleccionar categoría...</option>
              {categoriasDisponibles.map((c: CategoriaOption) => (
                <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              value={newMonto}
              onChange={e => setNewMonto(e.target.value)}
              placeholder="Monto límite"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-40 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAgregar}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Guardar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="space-y-3">
        {(!presupuestos || presupuestos.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-500 font-medium">Sin presupuestos configurados</p>
            <p className="text-sm text-gray-400 mt-1">Agregá límites de gasto por categoría para este mes</p>
          </div>
        )}
        {(presupuestos ?? []).map((p: PresupuestoRow) => {
          const gastado = getGastadoParaCategoria(p.categoriaId)
          const pct = p.monto > 0 ? gastado / p.monto : 0
          const barColor = pct >= 1 ? 'bg-red-500' : pct >= p.alertaAlPct ? 'bg-yellow-400' : 'bg-green-400'
          const isEditingThis = editando === p.id

          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.categoria.icono}</span>
                  <span className="font-medium text-gray-800">{p.categoria.nombre}</span>
                  {pct >= 1 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Excedido</span>}
                  {pct >= p.alertaAlPct && pct < 1 && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Cerca del límite</span>}
                </div>
                <div className="flex items-center gap-2">
                  {isEditingThis ? (
                    <>
                      <input
                        type="number"
                        value={editMonto}
                        onChange={e => setEditMonto(e.target.value)}
                        className="text-sm border border-indigo-300 rounded-lg px-2 py-1 w-32 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => handleGuardarEdicion(p)} className="text-green-600 hover:text-green-800">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">{formatearMoneda(gastado)} / <span className="font-semibold text-gray-700">{formatearMoneda(p.monto)}</span></span>
                      <button onClick={() => handleEditar(p)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`${barColor} h-2.5 rounded-full transition-all`}
                  style={{ width: `${Math.min(pct * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{Math.round(pct * 100)}% utilizado</span>
                <span>Alerta al {Math.round(p.alertaAlPct * 100)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

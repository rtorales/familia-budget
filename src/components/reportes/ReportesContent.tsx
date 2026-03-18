'use client'
import { useState } from 'react'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { formatearMoneda, formatearMesAnio } from '@/lib/formatters'
import { Download } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Tab = 'flujo' | 'categorias' | 'comparativa'

interface CategoriaTotales {
  nombre: string
  icono: string
  color: string
  total: number
  porcentaje: number
}

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#64748b']

export default function ReportesContent() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [tab, setTab] = useState<Tab>('flujo')
  const [mesesFlujo, setMesesFlujo] = useState(6)

  const { data: resumen } = useSWR(`/api/reportes/resumen?mes=${mes}&anio=${anio}`, fetcher)
  const { data: flujoCaja } = useSWR(`/api/reportes/flujo-caja?meses=${mesesFlujo}`, fetcher)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const handleExportarExcel = () => {
    alert('Funcionalidad de exportación a Excel disponible. Integrá con la librería xlsx para generar el archivo.')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'flujo', label: 'Flujo de Caja' },
    { id: 'categorias', label: 'Por Categoría' },
    { id: 'comparativa', label: 'Comparativa' },
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
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
            onClick={handleExportarExcel}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {resumen && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ingresos</p>
            <p className="text-xl font-bold text-green-600">{formatearMoneda(resumen.totalIngresos)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-red-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gastos</p>
            <p className="text-xl font-bold text-red-500">{formatearMoneda(resumen.totalGastos)}</p>
          </div>
          <div className={`bg-white rounded-xl p-5 border shadow-sm ${resumen.balance >= 0 ? 'border-indigo-100' : 'border-red-100'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Balance</p>
            <p className={`text-xl font-bold ${resumen.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {formatearMoneda(resumen.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 px-4 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'flujo' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Evolución mensual de ingresos y gastos</h3>
                <select
                  value={mesesFlujo}
                  onChange={e => setMesesFlujo(+e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value={3}>Últimos 3 meses</option>
                  <option value={6}>Últimos 6 meses</option>
                  <option value={12}>Últimos 12 meses</option>
                </select>
              </div>
              {flujoCaja && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={flujoCaja} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatearMoneda(Number(v ?? 0))} />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {tab === 'categorias' && resumen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Distribución por categoría</h3>
                {resumen.gastosPorCategoria?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={resumen.gastosPorCategoria}
                        dataKey="total"
                        nameKey="nombre"
                        cx="50%" cy="50%"
                        outerRadius={100}
                      >
                        {resumen.gastosPorCategoria.map((_: unknown, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatearMoneda(Number(v ?? 0))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-12">Sin datos para este período</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Detalle por categoría</h3>
                <div className="space-y-3">
                  {(resumen.gastosPorCategoria ?? []).sort((a: CategoriaTotales, b: CategoriaTotales) => b.total - a.total).map((cat: CategoriaTotales, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg">{cat.icono}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{cat.nombre}</span>
                          <span className="text-gray-500">{formatearMoneda(cat.total)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${cat.porcentaje * 100}%`,
                              background: COLORS[i % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{Math.round(cat.porcentaje * 100)}%</span>
                    </div>
                  ))}
                  {(!resumen.gastosPorCategoria || resumen.gastosPorCategoria.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-8">Sin gastos registrados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'comparativa' && flujoCaja && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Balance mensual (ingresos - gastos)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={flujoCaja}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatearMoneda(Number(v ?? 0))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    name="Gastos"
                    stroke="#f87171"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertTriangle, Clock, PiggyBank, Clock3 } from 'lucide-react'
import { formatearMoneda, formatearFecha } from '@/lib/formatters'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface AlertaItem {
  categoriaId: string
  categoriaIcono: string
  categoriaNombre: string
  nivel: string
  gastado: number
  presupuesto: number
  porcentaje: number
}

interface GastoItem {
  id: string
  categoria: { icono: string; nombre: string; color: string }
  descripcion: string
  categorizacionAuto: boolean
  estado: string
  miembro: { nombre: string; color: string }
  fecha: string
  monto: number
}

interface CuotaItem {
  id: string
  concepto: string
  cuotaActual: number
  totalCuotas: number
  montoCuota: number
  miembro: { nombre: string; color: string }
  fechaProximaCuota: string
}

export default function DashboardContent() {
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()

  const { data: resumen } = useSWR(`/api/reportes/resumen?mes=${mes}&anio=${anio}`, fetcher)
  const { data: flujoCaja } = useSWR(`/api/reportes/flujo-caja?meses=6`, fetcher)
  const { data: alertas } = useSWR(`/api/alertas?mes=${mes}&anio=${anio}`, fetcher)
  const { data: gastos } = useSWR(`/api/gastos?mes=${mes}&anio=${anio}`, fetcher)
  const { data: cuotas } = useSWR('/api/cuotas', fetcher)

  if (!resumen || !flujoCaja) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32 border border-gray-100" />
        ))}
      </div>
    )
  }

  const kpis = [
    {
      label: 'Ingresos del Mes',
      value: formatearMoneda(resumen.totalIngresos),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      sub: null,
    },
    {
      label: 'Gastos Operativos',
      value: formatearMoneda(resumen.totalGastos),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-100',
      sub: null,
    },
    {
      label: 'Saldo Líquido',
      value: formatearMoneda(resumen.saldoLiquido),
      icon: Wallet,
      color: resumen.saldoLiquido >= 0 ? 'text-indigo-600' : 'text-red-600',
      bg: resumen.saldoLiquido >= 0 ? 'bg-indigo-50' : 'bg-red-50',
      border: resumen.saldoLiquido >= 0 ? 'border-indigo-100' : 'border-red-100',
      sub: 'Disponible en cuenta',
    },
    {
      label: 'Ahorros / Inversiones',
      value: formatearMoneda(resumen.totalAhorros),
      icon: PiggyBank,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      sub: 'Fondos mutuos y ahorros',
    },
    {
      label: 'Comprometido',
      value: formatearMoneda(resumen.totalProyectado),
      icon: Clock3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      sub: 'Gastos proyectados pendientes',
    },
    {
      label: 'Cuotas Activas',
      value: String(resumen.cuotasActivas),
      icon: CreditCard,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      sub: null,
    },
  ]

  const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#64748b']

  return (
    <div className="space-y-6">
      {/* Budget alerts */}
      {alertas && alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta: AlertaItem) => (
            <div
              key={alerta.categoriaId}
              className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium ${
                alerta.nivel === 'critico'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                {alerta.categoriaIcono} {alerta.categoriaNombre}:{' '}
                {alerta.nivel === 'critico' ? '¡Presupuesto excedido!' : 'Cerca del límite'}
                {' '}— {formatearMoneda(alerta.gastado)} de {formatearMoneda(alerta.presupuesto)} ({Math.round(alerta.porcentaje * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards — 3 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={`bg-white rounded-xl p-5 border ${kpi.border} shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <div className={`${kpi.bg} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>}
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash flow chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Flujo de Caja (últimos 6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={flujoCaja} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatearMoneda(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ahorros" name="Ahorros" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Gastos por Categoría</h2>
          {resumen.gastosPorCategoria?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={resumen.gastosPorCategoria}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ nombre, porcentaje }: any) => `${nombre} ${Math.round((porcentaje ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {resumen.gastosPorCategoria.map((_: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatearMoneda(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Sin gastos este mes</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Últimos Gastos</h2>
            <Link href="/gastos" className="text-indigo-600 text-sm hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(gastos ?? []).slice(0, 6).map((g: GastoItem) => (
              <div key={g.id} className={`px-5 py-3 flex items-center justify-between ${g.estado === 'PROYECTADO' ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{g.categoria.icono}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      {g.descripcion}
                      {g.estado === 'PROYECTADO' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Pendiente</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: g.miembro.color }} />
                      {g.miembro.nombre} · {formatearFecha(g.fecha)}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${g.estado === 'PROYECTADO' ? 'text-amber-500' : 'text-red-600'}`}>
                  -{formatearMoneda(g.monto)}
                </span>
              </div>
            ))}
            {(!gastos || gastos.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">Sin gastos este mes</p>
            )}
          </div>
        </div>

        {/* Active installments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Cuotas Activas</h2>
            <Link href="/cuotas" className="text-indigo-600 text-sm hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(cuotas ?? []).slice(0, 5).map((c: CuotaItem) => (
              <div key={c.id} className="px-5 py-3">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-800">{c.concepto}</p>
                  <span className="text-sm font-semibold text-orange-600">{formatearMoneda(c.montoCuota)}/mes</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-orange-400 h-1.5 rounded-full"
                      style={{ width: `${(c.cuotaActual / c.totalCuotas) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{c.cuotaActual}/{c.totalCuotas}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Próximo: {formatearFecha(c.fechaProximaCuota)}</span>
                  <span className="ml-1" style={{ color: c.miembro.color }}>· {c.miembro.nombre}</span>
                </div>
              </div>
            ))}
            {(!cuotas || cuotas.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">Sin cuotas activas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

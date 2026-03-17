'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useSWR from 'swr'
import { X, Sparkles } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const GastoFormSchema = z.object({
  descripcion: z.string().min(1, 'Requerido'),
  monto: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  miembroId: z.string().min(1, 'Requerido'),
  categoriaId: z.string().min(1, 'Requerido'),
  tipo: z.enum(['CASUAL', 'CUOTA']),
  notas: z.string().optional(),
  cuotaConcepto: z.string().optional(),
  cuotaMontoTotal: z.string().optional(),
  cuotaActual: z.string().optional(),
  cuotaTotalCuotas: z.string().optional(),
  cuotaFechaInicio: z.string().optional(),
  cuotaFechaProxima: z.string().optional(),
})

type FormData = z.infer<typeof GastoFormSchema>

interface MiembroOption { id: string; nombre: string }
interface CategoriaOption { id: string; icono: string; nombre: string }
interface AutoCategoriaResult { categoriaId: string; nombre: string; confianza: number }

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function GastoFormModal({ onClose, onSuccess }: Props) {
  const [autoCategoria, setAutoCategoria] = useState<AutoCategoriaResult | null>(null)

  const { data: miembros } = useSWR('/api/miembros', fetcher)
  const { data: categorias } = useSWR('/api/categorias', fetcher)

  const hoy = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(GastoFormSchema),
    defaultValues: {
      fecha: hoy,
      tipo: 'CASUAL',
    }
  })

  const tipo = watch('tipo')
  const descripcion = watch('descripcion')

  // Auto-categorize on description change
  useEffect(() => {
    if (!descripcion || descripcion.length < 3) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/categorizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descripcion }),
        })
        const data = await res.json()
        if (data) {
          setAutoCategoria(data)
          setValue('categoriaId', data.categoriaId)
        }
      } catch {
        // Silent fail on auto-categorization
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [descripcion, setValue])

  const onSubmit = async (data: FormData) => {
    const body: Record<string, unknown> = {
      miembroId: data.miembroId,
      categoriaId: data.categoriaId,
      descripcion: data.descripcion,
      monto: parseFloat(data.monto),
      fecha: data.fecha,
      tipo: data.tipo,
      notas: data.notas,
    }

    if (data.tipo === 'CUOTA') {
      const montoCuota = parseFloat(data.monto)
      const totalCuotas = parseInt(data.cuotaTotalCuotas ?? '1')
      const cuotaActual = parseInt(data.cuotaActual ?? '1')
      body.cuota = {
        concepto: data.cuotaConcepto ?? data.descripcion,
        montoTotal: parseFloat(data.cuotaMontoTotal ?? String(montoCuota * totalCuotas)),
        montoCuota,
        cuotaActual,
        totalCuotas,
        fechaInicio: data.cuotaFechaInicio ?? data.fecha,
        fechaProximaCuota: data.cuotaFechaProxima ?? data.fecha,
      }
    }

    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo Gasto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <input
              {...register('descripcion')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Ej: Supermercado Carrefour"
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
              <input
                {...register('monto')}
                type="number"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
              {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                {...register('fecha')}
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miembro *</label>
              <select
                {...register('miembroId')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar...</option>
                {miembros?.map((m: MiembroOption) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              {errors.miembroId && <p className="text-red-500 text-xs mt-1">{errors.miembroId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
                {autoCategoria && (
                  <span className="ml-2 text-xs text-indigo-600 font-normal inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto ({Math.round(autoCategoria.confianza * 100)}%)
                  </span>
                )}
              </label>
              <select
                {...register('categoriaId')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar...</option>
                {categorias?.map((c: CategoriaOption) => (
                  <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                ))}
              </select>
              {errors.categoriaId && <p className="text-red-500 text-xs mt-1">{errors.categoriaId.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-4">
              {(['CASUAL', 'CUOTA'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} {...register('tipo')} className="text-indigo-600" />
                  <span className="text-sm">{t === 'CASUAL' ? 'Gasto único' : 'En cuotas'}</span>
                </label>
              ))}
            </div>
          </div>

          {tipo === 'CUOTA' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-orange-800">Detalles del plan de cuotas</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Concepto del plan</label>
                <input
                  {...register('cuotaConcepto')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  placeholder="Ej: Auto Fiat Cronos"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cuota actual</label>
                  <input
                    {...register('cuotaActual')}
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Total cuotas</label>
                  <input
                    {...register('cuotaTotalCuotas')}
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Monto total</label>
                  <input
                    {...register('cuotaMontoTotal')}
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fecha inicio</label>
                  <input
                    {...register('cuotaFechaInicio')}
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Próxima cuota</label>
                  <input
                    {...register('cuotaFechaProxima')}
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              {...register('notas')}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Observaciones..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

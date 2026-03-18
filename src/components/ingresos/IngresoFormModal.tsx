'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useSWR from 'swr'
import { X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const IngresoFormSchema = z.object({
  concepto: z.string().min(1, 'Requerido'),
  monto: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  miembroId: z.string().min(1, 'Requerido'),
  esRecurrente: z.boolean(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof IngresoFormSchema>

interface MiembroOption { id: string; nombre: string }

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function IngresoFormModal({ onClose, onSuccess }: Props) {
  const { data: miembros } = useSWR('/api/miembros', fetcher)
  const hoy = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(IngresoFormSchema),
    defaultValues: {
      fecha: hoy,
      esRecurrente: false,
    }
  })

  const onSubmit = async (data: FormData) => {
    await fetch('/api/ingresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        monto: parseFloat(data.monto),
      }),
    })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo Ingreso</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <input
              {...register('concepto')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Sueldo mensual"
            />
            {errors.concepto && <p className="text-red-500 text-xs mt-1">{errors.concepto.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
              <input
                {...register('monto')}
                type="number"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
              {errors.monto && <p className="text-red-500 text-xs mt-1">{errors.monto.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                {...register('fecha')}
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miembro *</label>
            <select
              {...register('miembroId')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar...</option>
              {miembros?.map((m: MiembroOption) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            {errors.miembroId && <p className="text-red-500 text-xs mt-1">{errors.miembroId.message}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('esRecurrente')}
              className="rounded text-green-600 border-gray-300"
            />
            <span className="text-sm text-gray-700">Ingreso recurrente (mensual)</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              {...register('notas')}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observaciones..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

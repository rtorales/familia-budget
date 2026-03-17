import { Suspense } from 'react'
import PresupuestosContent from '@/components/presupuestos/PresupuestosContent'

export default function PresupuestosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
        <p className="text-gray-500 text-sm mt-1">Límites de gasto por categoría</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <PresupuestosContent />
      </Suspense>
    </div>
  )
}

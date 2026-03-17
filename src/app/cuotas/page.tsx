import { Suspense } from 'react'
import CuotasContent from '@/components/cuotas/CuotasContent'

export default function CuotasPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cuotas y Créditos</h1>
        <p className="text-gray-500 text-sm mt-1">Planes de pago activos y proyección de gastos</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <CuotasContent />
      </Suspense>
    </div>
  )
}

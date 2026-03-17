import { Suspense } from 'react'
import IngresosContent from '@/components/ingresos/IngresosContent'

export default function IngresosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
        <p className="text-gray-500 text-sm mt-1">Registro de todos los ingresos familiares</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <IngresosContent />
      </Suspense>
    </div>
  )
}

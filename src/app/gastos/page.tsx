import { Suspense } from 'react'
import GastosContent from '@/components/gastos/GastosContent'

export default function GastosPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de todos los gastos familiares</p>
        </div>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <GastosContent />
      </Suspense>
    </div>
  )
}

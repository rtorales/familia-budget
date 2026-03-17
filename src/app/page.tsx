import { Suspense } from 'react'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>
        <p className="text-gray-500 text-sm mt-1">Vista general de las finanzas familiares</p>
      </div>
      <Suspense fallback={<div className="animate-pulse">Cargando...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

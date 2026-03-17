import { Suspense } from 'react'
import ReportesContent from '@/components/reportes/ReportesContent'

export default function ReportesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Análisis detallado de las finanzas familiares</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <ReportesContent />
      </Suspense>
    </div>
  )
}

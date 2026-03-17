import { Suspense } from 'react'
import EscanerContent from '@/components/escaner/EscanerContent'

export default function EscanerPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escanear Ticket</h1>
        <p className="text-gray-500 text-sm mt-1">Cargá un ticket o foto de recibo para registrar el gasto automáticamente</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <EscanerContent />
      </Suspense>
    </div>
  )
}

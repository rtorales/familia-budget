import { Suspense } from 'react'
import ConfiguracionContent from '@/components/configuracion/ConfiguracionContent'

export default function ConfiguracionPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de la familia y preferencias</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-xl" />}>
        <ConfiguracionContent />
      </Suspense>
    </div>
  )
}

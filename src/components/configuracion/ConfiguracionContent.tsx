'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Save, User, Palette } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Miembro {
  id: string
  nombre: string
  color: string
  rol: string
  activo: boolean
}

const COLORES_PREDEFINIDOS = [
  '#6366f1', '#ec4899', '#22c55e', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#64748b', '#14b8a6',
]

export default function ConfiguracionContent() {
  const { data: miembros, mutate } = useSWR('/api/miembros', fetcher)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editColor, setEditColor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  const handleEditar = (m: Miembro) => {
    setEditandoId(m.id)
    setEditNombre(m.nombre)
    setEditColor(m.color)
  }

  const handleGuardar = async () => {
    if (!editandoId) return
    setGuardando(true)
    try {
      await fetch(`/api/miembros/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, color: editColor }),
      })
      setEditandoId(null)
      setMensajeExito('Cambios guardados correctamente')
      setTimeout(() => setMensajeExito(''), 3000)
      mutate()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {mensajeExito && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
          {mensajeExito}
        </div>
      )}

      {/* Family section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Miembros de la familia</h2>
        </div>

        {!miembros && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {(miembros ?? []).map((m: Miembro) => (
            <div key={m.id} className="border border-gray-100 rounded-xl p-4">
              {editandoId === m.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                    <input
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Color de identificación
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLORES_PREDEFINIDOS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            editColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                          }`}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: editColor }}
                    >
                      {editNombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">Vista previa</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGuardar}
                      disabled={guardando}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: m.color }}
                    >
                      {m.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{m.nombre}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.rol}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditar(m)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Información de la aplicación</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Versión</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Base de datos</span>
            <span className="font-medium">SQLite (local)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">ORM</span>
            <span className="font-medium">Drizzle ORM</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Framework</span>
            <span className="font-medium">Next.js 14 App Router</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h2 className="font-semibold text-red-800 mb-2">Zona de peligro</h2>
        <p className="text-sm text-gray-500 mb-4">Estas acciones son irreversibles. Tené cuidado.</p>
        <button
          onClick={() => alert('Para limpiar los datos, ejecutá el script de seed nuevamente: npm run seed')}
          className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Instrucciones para resetear datos
        </button>
      </div>
    </div>
  )
}

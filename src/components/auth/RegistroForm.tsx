'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const COLORES = [
  '#6366f1', '#ec4899', '#22c55e', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
]

export default function RegistroForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    familiaNombre: '',
    miembro1Nombre: '',
    miembro1Color: '#6366f1',
    miembro2Nombre: '',
    miembro2Color: '#ec4899',
  })

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al registrarse')
      setLoading(false)
      return
    }

    // Auto-login after registration
    const result = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Registro exitoso pero error al ingresar. Intentá desde el login.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const canGoStep2 = form.email && form.password.length >= 6 && form.nombre
  const canGoStep3 = form.familiaNombre && form.miembro1Nombre && form.miembro2Nombre

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">FamiliaBudget</h1>
        <p className="text-gray-500 text-sm mt-1">Creá tu cuenta familiar</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                s < step ? 'bg-indigo-600 text-white' :
                s === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Step 1: User credentials */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tu cuenta</h2>
              <p className="text-sm text-gray-500 mt-0.5">Con qué vas a ingresar a la app</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Carlos García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="nombre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => canGoStep2 && setStep(2)}
              disabled={!canGoStep2}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Family setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tu familia</h2>
              <p className="text-sm text-gray-500 mt-0.5">Nombre y miembros principales</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la familia</label>
              <input
                type="text"
                value={form.familiaNombre}
                onChange={e => set('familiaNombre', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Los García"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miembro 1</label>
                <input
                  type="text"
                  value={form.miembro1Nombre}
                  onChange={e => set('miembro1Nombre', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Carlos"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {COLORES.slice(0, 4).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('miembro1Color', c)}
                      className={`w-6 h-6 rounded-full transition-transform ${form.miembro1Color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miembro 2</label>
                <input
                  type="text"
                  value={form.miembro2Nombre}
                  onChange={e => set('miembro2Nombre', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Laura"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {COLORES.slice(4).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('miembro2Color', c)}
                      className={`w-6 h-6 rounded-full transition-transform ${form.miembro2Color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                onClick={() => canGoStep3 && setStep(3)}
                disabled={!canGoStep3}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">¡Todo listo!</h2>
              <p className="text-sm text-gray-500 mt-0.5">Confirmá los datos antes de crear tu cuenta</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cuenta:</span>
                <span className="font-medium">{form.nombre} ({form.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Familia:</span>
                <span className="font-medium">{form.familiaNombre}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Miembros:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: form.miembro1Color }} />
                    {form.miembro1Nombre}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: form.miembro2Color }} />
                    {form.miembro2Nombre}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
              <p className="font-medium mb-1">Se va a crear automáticamente:</p>
              <ul className="space-y-1 text-indigo-600 list-disc list-inside">
                <li>10 categorías con auto-clasificación</li>
                <li>1 ingreso de ejemplo (sueldo)</li>
                <li>1 gasto de ejemplo (supermercado)</li>
                <li>1 gasto en cuotas de ejemplo (celular 1/12)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creando...' : <><Check className="w-4 h-4" /> Crear cuenta</>}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

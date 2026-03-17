'use client'
import { useState, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { Upload, Camera, Sparkles, Check, AlertCircle } from 'lucide-react'
import { formatearMoneda } from '@/lib/formatters'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface OCRResultado {
  textoRaw: string
  monto: number | null
  fecha: string | null
  comercio: string | null
  confianza: number
}

interface MiembroOption { id: string; nombre: string; color: string }
interface CategoriaOption { id: string; icono: string; nombre: string }
interface AutoCat { categoriaId: string; nombre: string; confianza: number }

type EstadoProceso = 'idle' | 'procesando' | 'resultado' | 'guardado' | 'error'

export default function EscanerContent() {
  const [estado, setEstado] = useState<EstadoProceso>('idle')
  const [imagen, setImagen] = useState<string | null>(null)
  const [resultado, setResultado] = useState<OCRResultado | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [miembroId, setMiembroId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [montoEditable, setMontoEditable] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [autoCategoria, setAutoCategoria] = useState<AutoCat | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { data: miembros } = useSWR('/api/miembros', fetcher)
  const { data: categorias } = useSWR('/api/categorias', fetcher)

  const procesarImagen = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor seleccioná una imagen válida (JPG, PNG, etc.)')
      setEstado('error')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setImagen(dataUrl)
      setEstado('procesando')

      try {
        // Use Tesseract.js directly in the browser
        const Tesseract = (await import('tesseract.js')).default
        const { data } = await Tesseract.recognize(dataUrl, 'spa', {
          logger: () => {},
        })

        const texto = data.text
        const lineas = texto.split('\n').map((l: string) => l.trim()).filter(Boolean)

        // Extract amount
        const montoPatterns = texto.match(/\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g) || []
        let monto: number | null = null
        let maxMonto = 0
        for (const match of montoPatterns) {
          const limpio = match.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.')
          const num = parseFloat(limpio)
          if (!isNaN(num) && num > maxMonto) {
            maxMonto = num
            monto = num
          }
        }

        // Extract date
        const fechaMatch = texto.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
        const fecha = fechaMatch ? fechaMatch[0] : null

        // Extract merchant
        const comercio = lineas.find((l: string) => !/^\d/.test(l) && l.length > 2) || null

        const ocr: OCRResultado = {
          textoRaw: texto,
          monto,
          fecha,
          comercio,
          confianza: data.confidence / 100,
        }

        setResultado(ocr)
        setMontoEditable(monto ? String(monto) : '')
        setDescripcion(comercio ?? '')

        // Auto-categorize based on merchant name
        if (comercio) {
          const res = await fetch('/api/categorizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion: comercio }),
          })
          const cat = await res.json()
          if (cat) {
            setAutoCategoria(cat)
            setCategoriaId(cat.categoriaId)
          }
        }

        setEstado('resultado')
      } catch (err) {
        console.error(err)
        setErrorMsg('Error al procesar la imagen. Asegurate de que sea legible.')
        setEstado('error')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarImagen(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) procesarImagen(file)
  }

  const handleGuardarGasto = async () => {
    if (!miembroId || !categoriaId || !montoEditable) {
      alert('Completá miembro, categoría y monto antes de guardar.')
      return
    }

    const fechaHoy = new Date().toISOString().split('T')[0]
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        miembroId,
        categoriaId,
        descripcion: descripcion || 'Ticket escaneado',
        monto: parseFloat(montoEditable),
        fecha: fechaHoy,
        tipo: 'CASUAL',
        notas: `Cargado via OCR. Confianza: ${Math.round((resultado?.confianza ?? 0) * 100)}%`,
      }),
    })
    setEstado('guardado')
  }

  const handleReiniciar = () => {
    setEstado('idle')
    setImagen(null)
    setResultado(null)
    setErrorMsg('')
    setMiembroId('')
    setCategoriaId('')
    setMontoEditable('')
    setDescripcion('')
    setAutoCategoria(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {estado === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white rounded-2xl border-2 border-dashed cursor-pointer transition-all p-12 text-center ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <Camera className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-2">Arrastrá una foto del ticket</p>
          <p className="text-sm text-gray-400 mb-4">o hacé clic para seleccionar desde tu dispositivo</p>
          <div className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium">
            <Upload className="w-4 h-4" />
            Seleccionar imagen
          </div>
          <p className="text-xs text-gray-300 mt-4">Soporta JPG, PNG, WEBP · Máximo 10MB</p>
        </div>
      )}

      {estado === 'procesando' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          {imagen && (
            <img src={imagen} alt="Ticket" className="max-h-48 mx-auto mb-6 rounded-lg object-contain border border-gray-100" />
          )}
          <div className="flex items-center justify-center gap-3 text-indigo-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-medium">Procesando imagen con OCR...</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Esto puede tardar unos segundos</p>
          <div className="mt-4 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {estado === 'resultado' && resultado && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {imagen && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Imagen original</p>
                <img src={imagen} alt="Ticket" className="w-full max-h-48 object-contain rounded-lg" />
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Texto detectado</p>
              <div className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-lg h-36 overflow-y-auto whitespace-pre-wrap">
                {resultado.textoRaw || 'No se pudo extraer texto'}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Confianza OCR: {Math.round(resultado.confianza * 100)}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Datos detectados — verificá y completá</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Comercio</label>
                <input
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre del comercio"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                    {resultado.monto && <span className="ml-2 text-xs text-indigo-600">Detectado: {formatearMoneda(resultado.monto)}</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoEditable}
                    onChange={e => setMontoEditable(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha detectada
                  </label>
                  <input
                    readOnly
                    value={resultado.fecha ?? 'No detectada'}
                    className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miembro *</label>
                  <select
                    value={miembroId}
                    onChange={e => setMiembroId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar...</option>
                    {miembros?.map((m: MiembroOption) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                    {autoCategoria && (
                      <span className="ml-1 text-xs text-indigo-600">Auto ({Math.round(autoCategoria.confianza * 100)}%)</span>
                    )}
                  </label>
                  <select
                    value={categoriaId}
                    onChange={e => setCategoriaId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias?.map((c: CategoriaOption) => (
                      <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReiniciar}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Escanear otro
                </button>
                <button
                  onClick={handleGuardarGasto}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Guardar gasto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {estado === 'guardado' && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-12 text-center">
          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-800 mb-2">¡Gasto guardado correctamente!</p>
          <p className="text-sm text-gray-400 mb-6">El gasto fue registrado desde el ticket escaneado</p>
          <button
            onClick={handleReiniciar}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Escanear otro ticket
          </button>
        </div>
      )}

      {estado === 'error' && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-800 mb-2">Error al procesar</p>
          <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
          <button
            onClick={handleReiniciar}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Tips */}
      {estado === 'idle' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-medium text-gray-800 mb-3">Consejos para mejores resultados</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              Asegurate de que el ticket esté bien iluminado y enfocado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              El texto debe ser legible; evitá sombras y dobleces
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              El sistema detecta automáticamente el monto total y el comercio
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              Siempre verificá los datos detectados antes de guardar
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

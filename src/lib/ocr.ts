import Tesseract from 'tesseract.js'

export interface ResultadoOCR {
  textoRaw: string
  monto: number | null
  fecha: string | null
  comercio: string | null
  confianza: number
}

export async function procesarTicket(imagenPath: string): Promise<ResultadoOCR> {
  const { data } = await Tesseract.recognize(imagenPath, 'spa', {
    logger: () => {},
  })

  const texto = data.text
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean)

  // Extract amount: find largest number in the text
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

  // Extract merchant name: first non-empty line that doesn't start with a number
  const comercio = lineas.find(l => !/^\d/.test(l) && l.length > 2) || null

  return {
    textoRaw: texto,
    monto,
    fecha,
    comercio,
    confianza: data.confidence / 100,
  }
}

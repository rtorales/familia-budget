export function formatearMoneda(monto: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatearMesAnio(mes: number, anio: number): string {
  const fecha = new Date(anio, mes - 1, 1)
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fecha)
}

export function mesActual(): { mes: number; anio: number } {
  const hoy = new Date()
  return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() }
}

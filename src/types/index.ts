export interface GastoConRelaciones {
  id: string
  descripcion: string
  monto: number
  fecha: string
  tipo: 'CASUAL' | 'CUOTA'
  categorizacionAuto: boolean
  confianzaCategoria: number | null
  notas: string | null
  creadoEn: string
  miembro: {
    id: string
    nombre: string
    color: string
  }
  categoria: {
    id: string
    nombre: string
    icono: string
    color: string
  }
  cuota?: CuotaDetalle | null
}

export interface CuotaDetalle {
  id: string
  concepto: string
  montoTotal: number
  montoCuota: number
  cuotaActual: number
  totalCuotas: number
  cuotasRestantes: number
  fechaInicio: string
  fechaProximaCuota: string
  frecuencia: string
  activa: boolean
}

export interface IngresoConMiembro {
  id: string
  concepto: string
  monto: number
  fecha: string
  esRecurrente: boolean
  notas: string | null
  miembro: {
    id: string
    nombre: string
    color: string
  }
}

export interface ResumenMensual {
  mes: number
  anio: number
  totalIngresos: number
  totalGastos: number
  balance: number
  cuotasActivas: number
  gastosPorCategoria: {
    categoriaId: string
    nombre: string
    icono: string
    color: string
    total: number
    porcentaje: number
  }[]
}

export interface DatoFlujoCaja {
  mes: string
  ingresos: number
  gastos: number
  balance: number
}

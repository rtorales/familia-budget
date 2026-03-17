interface CategoriaConKeywords {
  id: string
  nombre: string
  palabrasClave: string // JSON string array
}

interface ResultadoCategorizacion {
  categoriaId: string
  nombre: string
  confianza: number
}

// Default keywords fallback (used when no DB categories available)
const KEYWORDS_DEFAULT: Record<string, string[]> = {
  "Alimentación": ["supermercado", "carrefour", "dia", "coto", "verduleria", "verdulería", "panaderia", "panadería", "almacen", "almacén", "mercado", "walmart", "jumbo", "disco", "vea"],
  "Transporte": ["nafta", "ypf", "shell", "axion", "axión", "peaje", "tren", "subte", "remis", "uber", "cabify", "colectivo", "omnibus", "ómnibus", "combustible", "estacion de servicio"],
  "Salud": ["farmacia", "doctor", "medico", "médico", "consulta", "osde", "obra social", "clinica", "clínica", "hospital", "dentista", "odontologo", "odontólogo", "laboratorio"],
  "Educación": ["colegio", "jardin", "jardín", "escuela", "universidad", "libros", "utiles", "útiles", "cuota escolar", "academia"],
  "Entretenimiento": ["netflix", "spotify", "disney", "hbo", "amazon prime", "cine", "restaurant", "restaurante", "bar", "delivery", "pedidosya", "rappi", "teatro", "concert"],
  "Servicios": ["edesur", "edenor", "metrogas", "aysa", "internet", "fibertel", "claro", "personal", "movistar", "telecentro", "luz", "gas", "agua", "telefono", "teléfono"],
  "Cuotas y Créditos": ["cuota", "prestamo", "préstamo", "tarjeta", "financiacion", "financiación", "credito", "crédito", "banco"],
  "Ropa y Calzado": ["zara", "h&m", "ropa", "zapatillas", "calzado", "indumentaria", "remera", "pantalon", "pantalón", "zapatos"],
  "Hogar": ["ferreteria", "ferretería", "pintura", "muebles", "limpieza", "fravega", "frávega", "garbarino", "musimundo", "electrodomestico", "electrodoméstico"],
  "Seguros": ["seguro", "axa", "mapfre", "sancor", "la caja", "allianz", "zurich"],
}

export function categorizarGasto(descripcion: string, categorias: CategoriaConKeywords[]): ResultadoCategorizacion | null {
  const texto = descripcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  let mejorResultado: ResultadoCategorizacion | null = null
  let mejorPuntaje = 0

  for (const cat of categorias) {
    let keywords: string[] = []
    try {
      keywords = JSON.parse(cat.palabrasClave) as string[]
    } catch {
      keywords = []
    }

    let puntaje = 0
    for (const kw of keywords) {
      const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      if (texto.includes(kwNorm)) {
        // Longer keyword matches score higher (more specific)
        puntaje += kwNorm.length > 5 ? 2 : 1
      }
    }

    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje
      mejorResultado = {
        categoriaId: cat.id,
        nombre: cat.nombre,
        confianza: Math.min(puntaje / 3, 1.0),
      }
    }
  }

  return mejorResultado && mejorPuntaje > 0 ? mejorResultado : null
}

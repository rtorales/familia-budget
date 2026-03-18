import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { usuario, familia, miembro, categoria, ingreso, gasto, cuota, presupuesto } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

const RegistroSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(1),
  familiaNombre: z.string().min(1),
  miembro1Nombre: z.string().min(1),
  miembro1Color: z.string().default('#6366f1'),
  miembro2Nombre: z.string().min(1),
  miembro2Color: z.string().default('#ec4899'),
})

const CATEGORIAS_DEFAULT = [
  { nombre: 'Alimentación', icono: '🛒', color: '#22c55e', palabrasClave: JSON.stringify(['supermercado', 'carrefour', 'dia', 'coto', 'verduleria', 'panaderia', 'almacen', 'mercado']) },
  { nombre: 'Transporte', icono: '🚗', color: '#3b82f6', palabrasClave: JSON.stringify(['nafta', 'ypf', 'shell', 'axion', 'peaje', 'tren', 'subte', 'remis', 'uber']) },
  { nombre: 'Salud', icono: '🏥', color: '#ef4444', palabrasClave: JSON.stringify(['farmacia', 'doctor', 'medico', 'consulta', 'osde', 'obra social', 'clinica', 'hospital']) },
  { nombre: 'Educación', icono: '📚', color: '#f59e0b', palabrasClave: JSON.stringify(['colegio', 'jardin', 'escuela', 'universidad', 'libros', 'utiles', 'academia']) },
  { nombre: 'Entretenimiento', icono: '🎬', color: '#8b5cf6', palabrasClave: JSON.stringify(['netflix', 'spotify', 'disney', 'cine', 'restaurant', 'bar', 'delivery', 'pedidosya']) },
  { nombre: 'Servicios', icono: '💡', color: '#06b6d4', palabrasClave: JSON.stringify(['edesur', 'edenor', 'metrogas', 'aysa', 'internet', 'fibertel', 'claro', 'movistar']) },
  { nombre: 'Cuotas y Créditos', icono: '💳', color: '#f97316', palabrasClave: JSON.stringify(['cuota', 'prestamo', 'tarjeta', 'financiacion', 'credito', 'banco']) },
  { nombre: 'Hogar', icono: '🏠', color: '#84cc16', palabrasClave: JSON.stringify(['ferreteria', 'pintura', 'muebles', 'limpieza', 'fravega', 'garbarino']) },
  { nombre: 'Seguros', icono: '🛡️', color: '#64748b', palabrasClave: JSON.stringify(['seguro', 'axa', 'mapfre', 'sancor', 'allianz']) },
  { nombre: 'Ropa y Calzado', icono: '👗', color: '#ec4899', palabrasClave: JSON.stringify(['ropa', 'zapatillas', 'calzado', 'zara', 'indumentaria']) },
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = RegistroSchema.parse(body)

    // Check if email already exists
    const [existing] = db.select().from(usuario).where(eq(usuario.email, data.email.toLowerCase())).all()
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const familiaId = createId()
    const miembro1Id = createId()
    const miembro2Id = createId()
    const usuarioId = createId()
    const hoy = new Date()

    // Create familia
    db.insert(familia).values({
      id: familiaId,
      nombre: data.familiaNombre,
      moneda: 'ARS',
      locale: 'es-AR',
      creadoEn: hoy,
    }).run()

    // Create members
    db.insert(miembro).values([
      { id: miembro1Id, familiaId, nombre: data.miembro1Nombre, rol: 'admin', color: data.miembro1Color, activo: true, creadoEn: hoy },
      { id: miembro2Id, familiaId, nombre: data.miembro2Nombre, rol: 'contribuidor', color: data.miembro2Color, activo: true, creadoEn: hoy },
    ]).run()

    // Create user
    db.insert(usuario).values({
      id: usuarioId,
      email: data.email.toLowerCase(),
      passwordHash,
      nombre: data.nombre,
      familiaId,
      creadoEn: hoy,
    }).run()

    // Create default categories
    const categoriaIds: Record<string, string> = {}
    for (const cat of CATEGORIAS_DEFAULT) {
      const catId = createId()
      categoriaIds[cat.nombre] = catId
      db.insert(categoria).values({ id: catId, familiaId, ...cat, esSistema: true, creadoEn: hoy }).run()
    }

    // ─── 3 example records ────────────────────────────────────────────────────

    // 1. Ingreso de ejemplo
    db.insert(ingreso).values({
      id: createId(),
      miembroId: miembro1Id,
      concepto: 'Sueldo mensual (ejemplo)',
      monto: 350000,
      fecha: hoy,
      esRecurrente: true,
      notas: 'Este es un ingreso de ejemplo. Podés editarlo o eliminarlo.',
      creadoEn: hoy,
      actualizadoEn: hoy,
    }).run()

    // 2. Gasto casual de ejemplo
    db.insert(gasto).values({
      id: createId(),
      miembroId: miembro1Id,
      categoriaId: categoriaIds['Alimentación'],
      descripcion: 'Supermercado (ejemplo)',
      monto: 18500,
      fecha: hoy,
      tipo: 'CASUAL',
      categorizacionAuto: true,
      confianzaCategoria: 0.95,
      notas: 'Este es un gasto de ejemplo. Podés editarlo o eliminarlo.',
      creadoEn: hoy,
      actualizadoEn: hoy,
    }).run()

    // 3. Gasto en cuotas de ejemplo
    const gastoEjemploId = createId()
    db.insert(gasto).values({
      id: gastoEjemploId,
      miembroId: miembro2Id,
      categoriaId: categoriaIds['Cuotas y Créditos'],
      descripcion: 'Cuota celular (ejemplo)',
      monto: 8000,
      fecha: hoy,
      tipo: 'CUOTA',
      notas: 'Este es un gasto en cuotas de ejemplo.',
      creadoEn: hoy,
      actualizadoEn: hoy,
    }).run()

    const proximoMes = new Date(hoy)
    proximoMes.setMonth(proximoMes.getMonth() + 1)

    db.insert(cuota).values({
      id: createId(),
      gastoId: gastoEjemploId,
      concepto: 'Celular Samsung (ejemplo)',
      montoTotal: 96000,
      montoCuota: 8000,
      cuotaActual: 1,
      totalCuotas: 12,
      cuotasRestantes: 11,
      fechaInicio: hoy,
      fechaProximaCuota: proximoMes,
      frecuencia: 'MENSUAL',
      activa: true,
      notas: 'Plan de ejemplo. Podés editarlo.',
      creadoEn: hoy,
      actualizadoEn: hoy,
    }).run()

    // Presupuesto de ejemplo para Alimentación
    db.insert(presupuesto).values({
      id: createId(),
      familiaId,
      categoriaId: categoriaIds['Alimentación'],
      monto: 80000,
      mes: hoy.getMonth() + 1,
      anio: hoy.getFullYear(),
      alertaAlPct: 0.80,
      creadoEn: hoy,
      actualizadoEn: hoy,
    }).run()

    return NextResponse.json({ ok: true, familiaId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../src/lib/db/schema'
import { familia, miembro, categoria, ingreso, gasto, cuota, presupuesto, configuracion } from '../src/lib/db/schema'
import { mkdirSync } from 'fs'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'
import { sql } from 'drizzle-orm'

const DB_PATH = path.join(process.cwd(), 'data', 'familia.db')
mkdirSync(path.dirname(DB_PATH), { recursive: true })

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite, { schema })

async function main() {
  console.log('Sembrando datos de demostracion...')

  // Clean all tables
  db.delete(configuracion).run()
  db.delete(presupuesto).run()
  db.delete(cuota).run()
  db.delete(gasto).run()
  db.delete(ingreso).run()
  db.delete(categoria).run()
  db.delete(miembro).run()
  db.delete(familia).run()

  // Create family
  const familiaId = createId()
  db.insert(familia).values({
    id: familiaId,
    nombre: 'Los García',
    moneda: 'ARS',
    locale: 'es-AR',
    creadoEn: new Date(),
  }).run()

  // Create members
  const carlosId = createId()
  const lauraId = createId()

  db.insert(miembro).values([
    { id: carlosId, familiaId, nombre: 'Carlos', rol: 'admin', color: '#6366f1', activo: true, creadoEn: new Date() },
    { id: lauraId, familiaId, nombre: 'Laura', rol: 'contribuidor', color: '#ec4899', activo: true, creadoEn: new Date() },
  ]).run()

  // Create categories
  const cats = [
    { id: createId(), nombre: 'Alimentación', icono: '🛒', color: '#22c55e', esSistema: true, palabrasClave: JSON.stringify(['supermercado', 'carrefour', 'dia', 'coto', 'verduleria', 'panaderia', 'almacen', 'mercado', 'jumbo', 'disco']) },
    { id: createId(), nombre: 'Transporte', icono: '🚗', color: '#3b82f6', esSistema: true, palabrasClave: JSON.stringify(['nafta', 'ypf', 'shell', 'axion', 'peaje', 'tren', 'subte', 'remis', 'uber', 'combustible']) },
    { id: createId(), nombre: 'Salud', icono: '🏥', color: '#ef4444', esSistema: true, palabrasClave: JSON.stringify(['farmacia', 'doctor', 'medico', 'consulta', 'osde', 'obra social', 'clinica', 'hospital', 'dentista']) },
    { id: createId(), nombre: 'Educación', icono: '📚', color: '#f59e0b', esSistema: true, palabrasClave: JSON.stringify(['colegio', 'jardin', 'escuela', 'universidad', 'libros', 'utiles', 'academia']) },
    { id: createId(), nombre: 'Entretenimiento', icono: '🎬', color: '#8b5cf6', esSistema: true, palabrasClave: JSON.stringify(['netflix', 'spotify', 'disney', 'cine', 'restaurant', 'bar', 'delivery', 'pedidosya', 'rappi']) },
    { id: createId(), nombre: 'Servicios', icono: '💡', color: '#06b6d4', esSistema: true, palabrasClave: JSON.stringify(['edesur', 'edenor', 'metrogas', 'aysa', 'internet', 'fibertel', 'claro', 'personal', 'movistar']) },
    { id: createId(), nombre: 'Cuotas y Créditos', icono: '💳', color: '#f97316', esSistema: true, palabrasClave: JSON.stringify(['cuota', 'prestamo', 'tarjeta', 'financiacion', 'credito', 'banco']) },
    { id: createId(), nombre: 'Hogar', icono: '🏠', color: '#84cc16', esSistema: true, palabrasClave: JSON.stringify(['ferreteria', 'pintura', 'muebles', 'limpieza', 'fravega', 'garbarino', 'electrodomestico']) },
    { id: createId(), nombre: 'Seguros', icono: '🛡️', color: '#64748b', esSistema: true, palabrasClave: JSON.stringify(['seguro', 'axa', 'mapfre', 'sancor', 'allianz']) },
    { id: createId(), nombre: 'Ropa y Calzado', icono: '👗', color: '#ec4899', esSistema: true, palabrasClave: JSON.stringify(['ropa', 'zapatillas', 'calzado', 'zara', 'indumentaria', 'zapatos']) },
  ]

  db.insert(categoria).values(cats.map(c => ({ ...c, familiaId, creadoEn: new Date() }))).run()

  const [catAlimentacion, catTransporte, catSalud, catEducacion, catEntretenimiento, catServicios, catCuotas, catHogar, catSeguros] = cats

  const hoy = new Date()

  // Seed 6 months
  for (let mesesAtras = 5; mesesAtras >= 0; mesesAtras--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1)
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()

    const rnd = (base: number, pct = 0.2) => Math.round(base + (Math.random() - 0.5) * base * pct)
    const dia = (d: number) => new Date(anio, mes - 1, d)
    const getMiembro = () => Math.random() > 0.5 ? carlosId : lauraId

    // INGRESOS
    db.insert(ingreso).values([
      { id: createId(), miembroId: carlosId, concepto: 'Sueldo mensual', monto: rnd(450000), fecha: dia(5), esRecurrente: true, creadoEn: new Date(), actualizadoEn: new Date() },
      { id: createId(), miembroId: lauraId, concepto: 'Sueldo mensual', monto: rnd(380000), fecha: dia(7), esRecurrente: true, creadoEn: new Date(), actualizadoEn: new Date() },
      { id: createId(), miembroId: lauraId, concepto: 'Clases particulares', monto: rnd(55000), fecha: dia(25), esRecurrente: true, creadoEn: new Date(), actualizadoEn: new Date() },
    ]).run()

    if (Math.random() > 0.4) {
      db.insert(ingreso).values({
        id: createId(), miembroId: carlosId, concepto: 'Trabajo freelance',
        monto: rnd(75000), fecha: dia(15 + Math.floor(Math.random() * 8)),
        esRecurrente: false, creadoEn: new Date(), actualizadoEn: new Date()
      }).run()
    }

    // GASTOS - Alimentación
    const alimentacionItems = [
      { desc: 'Supermercado Carrefour', monto: rnd(38000) },
      { desc: 'Verdulería Don José', monto: rnd(9000) },
      { desc: 'Panadería El Trigo', monto: rnd(4500) },
      { desc: 'Supermercado DIA', monto: rnd(22000) },
      { desc: 'Almacén La Esquina', monto: rnd(6500) },
    ]
    for (const item of alimentacionItems) {
      db.insert(gasto).values({
        id: createId(), miembroId: getMiembro(), categoriaId: catAlimentacion.id,
        descripcion: item.desc, monto: item.monto,
        fecha: dia(Math.floor(Math.random() * 27) + 1),
        tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.92,
        creadoEn: new Date(), actualizadoEn: new Date()
      }).run()
    }

    // Transporte
    db.insert(gasto).values([
      { id: createId(), miembroId: carlosId, categoriaId: catTransporte.id, descripcion: 'Nafta YPF', monto: rnd(24000), fecha: dia(Math.floor(Math.random() * 10) + 1), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.95, creadoEn: new Date(), actualizadoEn: new Date() },
      { id: createId(), miembroId: carlosId, categoriaId: catTransporte.id, descripcion: 'Peaje Acceso Norte', monto: rnd(3800), fecha: dia(Math.floor(Math.random() * 27) + 1), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.85, creadoEn: new Date(), actualizadoEn: new Date() },
    ]).run()
    if (Math.random() > 0.5) {
      db.insert(gasto).values({ id: createId(), miembroId: lauraId, categoriaId: catTransporte.id, descripcion: 'Uber - viaje trabajo', monto: rnd(3000), fecha: dia(Math.floor(Math.random() * 27) + 1), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.9, creadoEn: new Date(), actualizadoEn: new Date() }).run()
    }

    // Servicios
    db.insert(gasto).values([
      { id: createId(), miembroId: carlosId, categoriaId: catServicios.id, descripcion: 'Factura Edenor', monto: rnd(19000), fecha: dia(10), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.98, creadoEn: new Date(), actualizadoEn: new Date() },
      { id: createId(), miembroId: carlosId, categoriaId: catServicios.id, descripcion: 'Metrogas', monto: rnd(13000), fecha: dia(12), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.98, creadoEn: new Date(), actualizadoEn: new Date() },
      { id: createId(), miembroId: lauraId, categoriaId: catServicios.id, descripcion: 'Internet Fibertel', monto: 8500, fecha: dia(8), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.99, creadoEn: new Date(), actualizadoEn: new Date() },
    ]).run()

    // Entretenimiento
    db.insert(gasto).values({ id: createId(), miembroId: lauraId, categoriaId: catEntretenimiento.id, descripcion: 'Netflix', monto: 3200, fecha: dia(3), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.99, creadoEn: new Date(), actualizadoEn: new Date() }).run()
    if (Math.random() > 0.4) {
      db.insert(gasto).values({ id: createId(), miembroId: getMiembro(), categoriaId: catEntretenimiento.id, descripcion: 'Delivery PedidosYa', monto: rnd(9500), fecha: dia(Math.floor(Math.random() * 27) + 1), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.88, creadoEn: new Date(), actualizadoEn: new Date() }).run()
    }
    if (Math.random() > 0.6) {
      db.insert(gasto).values({ id: createId(), miembroId: getMiembro(), categoriaId: catEntretenimiento.id, descripcion: 'Restaurante familiar', monto: rnd(28000), fecha: dia(Math.floor(Math.random() * 27) + 1), tipo: 'CASUAL', categorizacionAuto: false, creadoEn: new Date(), actualizadoEn: new Date() }).run()
    }

    // Educación
    db.insert(gasto).values({ id: createId(), miembroId: lauraId, categoriaId: catEducacion.id, descripcion: 'Cuota colegio privado', monto: 47000, fecha: dia(5), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.85, creadoEn: new Date(), actualizadoEn: new Date() }).run()

    // Salud
    if (Math.random() > 0.4) {
      db.insert(gasto).values({ id: createId(), miembroId: getMiembro(), categoriaId: catSalud.id, descripcion: 'Farmacia', monto: rnd(9500), fecha: dia(Math.floor(Math.random() * 27) + 1), tipo: 'CASUAL', categorizacionAuto: true, confianzaCategoria: 0.92, creadoEn: new Date(), actualizadoEn: new Date() }).run()
    }

    // PRESUPUESTOS
    const presupuestosData = [
      { categoriaId: catAlimentacion.id, monto: 130000 },
      { categoriaId: catTransporte.id, monto: 60000 },
      { categoriaId: catEntretenimiento.id, monto: 40000 },
      { categoriaId: catServicios.id, monto: 50000 },
      { categoriaId: catSalud.id, monto: 30000 },
      { categoriaId: catEducacion.id, monto: 55000 },
    ]
    for (const p of presupuestosData) {
      db.insert(presupuesto).values({
        id: createId(), ...p, familiaId, mes, anio, alertaAlPct: 0.80,
        creadoEn: new Date(), actualizadoEn: new Date()
      }).onConflictDoNothing().run()
    }
  }

  // CUOTAS ACTIVAS
  const mesActual = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()

  const cuotasData = [
    {
      gasto: { miembroId: carlosId, descripcion: 'Cuota auto Fiat Cronos', monto: 45000 },
      cuota: { concepto: 'Auto Fiat Cronos', montoTotal: 2160000, montoCuota: 45000, cuotaActual: 18, totalCuotas: 48 }
    },
    {
      gasto: { miembroId: carlosId, descripcion: 'Cuota terreno Zona Norte', monto: 62000 },
      cuota: { concepto: 'Terreno Zona Norte', montoTotal: 7440000, montoCuota: 62000, cuotaActual: 6, totalCuotas: 120, notas: 'Lote 15, Barrio Los Aromos' }
    },
    {
      gasto: { miembroId: lauraId, descripcion: 'Cuota heladera Samsung', monto: 18500 },
      cuota: { concepto: 'Heladera Samsung 400L', montoTotal: 222000, montoCuota: 18500, cuotaActual: 9, totalCuotas: 12 }
    },
    {
      gasto: { miembroId: carlosId, descripcion: 'Seguro de vida AXA', monto: 8500 },
      cuota: { concepto: 'Seguro de Vida AXA', montoTotal: 102000, montoCuota: 8500, cuotaActual: 4, totalCuotas: 12, notas: 'Renovación anual en enero' }
    },
    {
      gasto: { miembroId: lauraId, descripcion: 'Cuota Notebook HP', monto: 28000 },
      cuota: { concepto: 'Notebook HP 15" i5', montoTotal: 504000, montoCuota: 28000, cuotaActual: 3, totalCuotas: 18 }
    },
  ]

  for (let i = 0; i < cuotasData.length; i++) {
    const item = cuotasData[i]
    const gastoId = createId()
    db.insert(gasto).values({
      id: gastoId,
      ...item.gasto,
      categoriaId: item.gasto.descripcion.includes('Seguro') ? catSeguros.id : catCuotas.id,
      fecha: new Date(anioActual, mesActual - 1, 10 + i),
      tipo: 'CUOTA',
      creadoEn: new Date(), actualizadoEn: new Date()
    }).run()

    db.insert(cuota).values({
      id: createId(),
      gastoId,
      ...item.cuota,
      cuotasRestantes: item.cuota.totalCuotas - item.cuota.cuotaActual,
      fechaInicio: new Date(anioActual - 1, mesActual - 1, 10),
      fechaProximaCuota: new Date(anioActual, mesActual, 10 + i),
      frecuencia: 'MENSUAL',
      activa: true,
      notas: (item.cuota as { notas?: string }).notas ?? null,
      creadoEn: new Date(), actualizadoEn: new Date()
    }).run()
  }

  // CONFIGURACIÓN
  db.insert(configuracion).values([
    { clave: 'familia_id', valor: familiaId, updatedAt: new Date() },
    { clave: 'moneda', valor: 'ARS', updatedAt: new Date() },
    { clave: 'familia_nombre', valor: 'Los García', updatedAt: new Date() },
  ]).onConflictDoUpdate({ target: configuracion.clave, set: { valor: sql`excluded.valor` } }).run()

  console.log('Datos sembrados exitosamente!')
  console.log('   - Familia: Los García (Carlos + Laura)')
  console.log('   - 10 categorías con palabras clave')
  console.log('   - 6 meses de ingresos y gastos')
  console.log('   - 5 planes de cuotas activos')
  console.log('   - Presupuestos por categoría')

  sqlite.close()
}

main().catch(console.error)

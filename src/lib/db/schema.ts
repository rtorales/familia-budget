import { pgTable, text, integer, real, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// ─── Family ──────────────────────────────────────────────────────────────────

export const familia = pgTable('familia', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  nombre: text('nombre').notNull().default('Mi Familia'),
  moneda: text('moneda').notNull().default('ARS'),
  locale: text('locale').notNull().default('es-AR'),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
})

export const familiaRelations = relations(familia, ({ many }) => ({
  miembros: many(miembro),
}))

// ─── Members ─────────────────────────────────────────────────────────────────

export const miembro = pgTable('miembro', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  nombre: text('nombre').notNull(),
  rol: text('rol').notNull().default('contribuidor'),
  color: text('color').notNull().default('#6366f1'),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
})

export const miembroRelations = relations(miembro, ({ one, many }) => ({
  familia: one(familia, { fields: [miembro.familiaId], references: [familia.id] }),
  ingresos: many(ingreso),
  gastos: many(gasto),
}))

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoria = pgTable('categoria', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  nombre: text('nombre').notNull(),
  icono: text('icono').notNull().default('💰'),
  color: text('color').notNull().default('#94a3b8'),
  esSistema: boolean('es_sistema').notNull().default(false),
  // true = dinero reservado en fondo/inversión, se muestra separado de gastos operativos
  esSaving: boolean('es_saving').notNull().default(false),
  palabrasClave: text('palabras_clave').notNull().default('[]'),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
})

export const categoriaRelations = relations(categoria, ({ many }) => ({
  gastos: many(gasto),
  presupuestos: many(presupuesto),
}))

// ─── Income ──────────────────────────────────────────────────────────────────

export const ingreso = pgTable('ingreso', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  miembroId: text('miembro_id').notNull().references(() => miembro.id),
  concepto: text('concepto').notNull(),
  monto: real('monto').notNull(),
  fecha: timestamp('fecha').notNull(),
  esRecurrente: boolean('es_recurrente').notNull().default(false),
  notas: text('notas'),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
  actualizadoEn: timestamp('actualizado_en').$defaultFn(() => new Date()),
})

export const ingresoRelations = relations(ingreso, ({ one }) => ({
  miembro: one(miembro, { fields: [ingreso.miembroId], references: [miembro.id] }),
}))

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const gasto = pgTable('gasto', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  miembroId: text('miembro_id').notNull().references(() => miembro.id),
  categoriaId: text('categoria_id').notNull().references(() => categoria.id),
  descripcion: text('descripcion').notNull(),
  monto: real('monto').notNull(),
  fecha: timestamp('fecha').notNull(),
  tipo: text('tipo').notNull().default('CASUAL'),
  // 'EJECUTADO' = ya pagado | 'PROYECTADO' = comprometido pero pendiente
  estado: text('estado').notNull().default('EJECUTADO'),
  ticketImagen: text('ticket_imagen'),
  ticketTextoOcr: text('ticket_texto_ocr'),
  categorizacionAuto: boolean('categorizacion_auto').notNull().default(false),
  confianzaCategoria: real('confianza_categoria'),
  notas: text('notas'),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
  actualizadoEn: timestamp('actualizado_en').$defaultFn(() => new Date()),
})

export const gastoRelations = relations(gasto, ({ one }) => ({
  miembro: one(miembro, { fields: [gasto.miembroId], references: [miembro.id] }),
  categoria: one(categoria, { fields: [gasto.categoriaId], references: [categoria.id] }),
  cuota: one(cuota, { fields: [gasto.id], references: [cuota.gastoId] }),
}))

// ─── Installment Plans ────────────────────────────────────────────────────────

export const cuota = pgTable('cuota', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  gastoId: text('gasto_id').notNull().unique().references(() => gasto.id),
  concepto: text('concepto').notNull(),
  montoTotal: real('monto_total').notNull(),
  montoCuota: real('monto_cuota').notNull(),
  cuotaActual: integer('cuota_actual').notNull(),
  totalCuotas: integer('total_cuotas').notNull(),
  cuotasRestantes: integer('cuotas_restantes').notNull(),
  fechaInicio: timestamp('fecha_inicio').notNull(),
  fechaProximaCuota: timestamp('fecha_proxima_cuota').notNull(),
  frecuencia: text('frecuencia').notNull().default('MENSUAL'),
  activa: boolean('activa').notNull().default(true),
  notas: text('notas'),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
  actualizadoEn: timestamp('actualizado_en').$defaultFn(() => new Date()),
})

export const cuotaRelations = relations(cuota, ({ one }) => ({
  gasto: one(gasto, { fields: [cuota.gastoId], references: [gasto.id] }),
}))

// ─── Budgets ─────────────────────────────────────────────────────────────────

export const presupuesto = pgTable('presupuesto', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  categoriaId: text('categoria_id').notNull().references(() => categoria.id),
  monto: real('monto').notNull(),
  mes: integer('mes').notNull(),
  anio: integer('anio').notNull(),
  alertaAlPct: real('alerta_al_pct').notNull().default(0.80),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
  actualizadoEn: timestamp('actualizado_en').$defaultFn(() => new Date()),
})

export const presupuestoRelations = relations(presupuesto, ({ one }) => ({
  categoria: one(categoria, { fields: [presupuesto.categoriaId], references: [categoria.id] }),
}))

// ─── Config ──────────────────────────────────────────────────────────────────

export const configuracion = pgTable('configuracion', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

// ─── Users ───────────────────────────────────────────────────────────────────

export const usuario = pgTable('usuario', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  creadoEn: timestamp('creado_en').$defaultFn(() => new Date()),
})

export const usuarioRelations = relations(usuario, ({ one }) => ({
  familia: one(familia, { fields: [usuario.familiaId], references: [familia.id] }),
}))

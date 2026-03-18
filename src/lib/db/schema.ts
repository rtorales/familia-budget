import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// ─── Family ──────────────────────────────────────────────────────────────────

export const familia = sqliteTable('familia', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  nombre: text('nombre').notNull().default('Mi Familia'),
  moneda: text('moneda').notNull().default('ARS'),
  locale: text('locale').notNull().default('es-AR'),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const familiaRelations = relations(familia, ({ many }) => ({
  miembros: many(miembro),
}))

// ─── Members ─────────────────────────────────────────────────────────────────

export const miembro = sqliteTable('miembro', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  nombre: text('nombre').notNull(),
  rol: text('rol').notNull().default('contribuidor'),
  color: text('color').notNull().default('#6366f1'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const miembroRelations = relations(miembro, ({ one, many }) => ({
  familia: one(familia, { fields: [miembro.familiaId], references: [familia.id] }),
  ingresos: many(ingreso),
  gastos: many(gasto),
}))

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoria = sqliteTable('categoria', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  nombre: text('nombre').notNull(),
  icono: text('icono').notNull().default('💰'),
  color: text('color').notNull().default('#94a3b8'),
  esSistema: integer('es_sistema', { mode: 'boolean' }).notNull().default(false),
  palabrasClave: text('palabras_clave').notNull().default('[]'),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const categoriaRelations = relations(categoria, ({ many }) => ({
  gastos: many(gasto),
  presupuestos: many(presupuesto),
}))

// ─── Income ──────────────────────────────────────────────────────────────────

export const ingreso = sqliteTable('ingreso', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  miembroId: text('miembro_id').notNull().references(() => miembro.id),
  concepto: text('concepto').notNull(),
  monto: real('monto').notNull(),
  fecha: integer('fecha', { mode: 'timestamp' }).notNull(),
  esRecurrente: integer('es_recurrente', { mode: 'boolean' }).notNull().default(false),
  notas: text('notas'),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  actualizadoEn: integer('actualizado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const ingresoRelations = relations(ingreso, ({ one }) => ({
  miembro: one(miembro, { fields: [ingreso.miembroId], references: [miembro.id] }),
}))

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const gasto = sqliteTable('gasto', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  miembroId: text('miembro_id').notNull().references(() => miembro.id),
  categoriaId: text('categoria_id').notNull().references(() => categoria.id),
  descripcion: text('descripcion').notNull(),
  monto: real('monto').notNull(),
  fecha: integer('fecha', { mode: 'timestamp' }).notNull(),
  tipo: text('tipo').notNull().default('CASUAL'), // CASUAL | CUOTA
  ticketImagen: text('ticket_imagen'),
  ticketTextoOcr: text('ticket_texto_ocr'),
  categorizacionAuto: integer('categorizacion_auto', { mode: 'boolean' }).notNull().default(false),
  confianzaCategoria: real('confianza_categoria'),
  notas: text('notas'),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  actualizadoEn: integer('actualizado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const gastoRelations = relations(gasto, ({ one }) => ({
  miembro: one(miembro, { fields: [gasto.miembroId], references: [miembro.id] }),
  categoria: one(categoria, { fields: [gasto.categoriaId], references: [categoria.id] }),
  cuota: one(cuota, { fields: [gasto.id], references: [cuota.gastoId] }),
}))

// ─── Installment Plans ────────────────────────────────────────────────────────

export const cuota = sqliteTable('cuota', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  gastoId: text('gasto_id').notNull().unique().references(() => gasto.id),
  concepto: text('concepto').notNull(),
  montoTotal: real('monto_total').notNull(),
  montoCuota: real('monto_cuota').notNull(),
  cuotaActual: integer('cuota_actual').notNull(),
  totalCuotas: integer('total_cuotas').notNull(),
  cuotasRestantes: integer('cuotas_restantes').notNull(),
  fechaInicio: integer('fecha_inicio', { mode: 'timestamp' }).notNull(),
  fechaProximaCuota: integer('fecha_proxima_cuota', { mode: 'timestamp' }).notNull(),
  frecuencia: text('frecuencia').notNull().default('MENSUAL'),
  activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
  notas: text('notas'),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  actualizadoEn: integer('actualizado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const cuotaRelations = relations(cuota, ({ one }) => ({
  gasto: one(gasto, { fields: [cuota.gastoId], references: [gasto.id] }),
}))

// ─── Budgets ─────────────────────────────────────────────────────────────────

export const presupuesto = sqliteTable('presupuesto', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  categoriaId: text('categoria_id').notNull().references(() => categoria.id),
  monto: real('monto').notNull(),
  mes: integer('mes').notNull(),
  anio: integer('anio').notNull(),
  alertaAlPct: real('alerta_al_pct').notNull().default(0.80),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  actualizadoEn: integer('actualizado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const presupuestoRelations = relations(presupuesto, ({ one }) => ({
  categoria: one(categoria, { fields: [presupuesto.categoriaId], references: [categoria.id] }),
}))

// ─── Config ──────────────────────────────────────────────────────────────────

export const configuracion = sqliteTable('configuracion', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ─── Users ───────────────────────────────────────────────────────────────────

export const usuario = sqliteTable('usuario', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  familiaId: text('familia_id').notNull().references(() => familia.id),
  creadoEn: integer('creado_en', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const usuarioRelations = relations(usuario, ({ one }) => ({
  familia: one(familia, { fields: [usuario.familiaId], references: [familia.id] }),
}))

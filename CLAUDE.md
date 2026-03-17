# FamiliaBudget — Contexto del Proyecto

App de rastreo de gastos y presupuesto familiar. Demo funcional con datos realistas.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| ORM | Drizzle ORM |
| Base de datos | SQLite via `better-sqlite3` (`./data/familia.db`) |
| Estilos | Tailwind CSS |
| Gráficos | Recharts |
| Fetch | SWR |
| Formularios | react-hook-form + Zod |
| IDs | @paralleldrive/cuid2 |
| OCR | Tesseract.js |
| Export PDF | @react-pdf/renderer |
| Export Excel | xlsx |
| Iconos | lucide-react |

> **Importante:** Se descartó Prisma (v5 y v7) porque no tiene binarios nativos para **Windows ARM64**.
> Drizzle ORM + better-sqlite3 funciona perfectamente en esta arquitectura.

## Estructura del Proyecto

```
familia-budget/
├── data/
│   └── familia.db              # SQLite database (gitignored)
├── drizzle/                    # Drizzle migration files
├── scripts/
│   └── seed.ts                 # Seed con 6 meses de datos demo
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout con Sidebar
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── gastos/             # Gestión de gastos
│   │   ├── ingresos/           # Gestión de ingresos
│   │   ├── cuotas/             # Tracker de cuotas/installments
│   │   ├── presupuestos/       # Presupuestos por categoría
│   │   ├── escaner/            # OCR de tickets
│   │   ├── reportes/           # Reportes + exportación
│   │   ├── configuracion/      # Config familia/miembros
│   │   └── api/                # Route Handlers
│   │       ├── gastos/
│   │       ├── ingresos/
│   │       ├── cuotas/
│   │       ├── presupuestos/
│   │       ├── categorias/
│   │       ├── miembros/
│   │       ├── alertas/
│   │       ├── categorizar/    # Auto-categorización
│   │       └── reportes/
│   │           ├── resumen/
│   │           └── flujo-caja/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardContent.tsx
│   │   ├── gastos/
│   │   │   ├── GastosContent.tsx
│   │   │   └── GastoFormModal.tsx
│   │   ├── ingresos/
│   │   ├── cuotas/
│   │   ├── presupuestos/
│   │   ├── reportes/
│   │   ├── escaner/
│   │   └── configuracion/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts        # Conexión better-sqlite3 + Drizzle
│   │   │   └── schema.ts       # Schema Drizzle (tablas)
│   │   ├── alertas.ts          # Cálculo de alertas de presupuesto
│   │   ├── categorizacion.ts   # Motor de auto-categorización
│   │   ├── formatters.ts       # Formato moneda/fecha (es-AR)
│   │   └── ocr.ts              # Wrapper Tesseract.js
│   └── types/
│       └── index.ts            # Interfaces TypeScript compartidas
└── drizzle.config.ts           # Config Drizzle Kit
```

## Base de Datos — Schema Drizzle

Tablas principales en `src/lib/db/schema.ts`:

- **`familia`** — Configuración de la familia (nombre, moneda, locale)
- **`miembro`** — Miembros de la familia (Carlos/Laura con color propio)
- **`categoria`** — Categorías de gastos con palabras clave para auto-clasificación
- **`ingreso`** — Ingresos por miembro (sueldo, freelance, etc.)
- **`gasto`** — Gastos (tipo CASUAL o CUOTA)
- **`cuota`** — Plan de cuotas vinculado a un gasto (seguimiento cuota actual/total)
- **`presupuesto`** — Límites de gasto por categoría/mes/año con umbral de alerta
- **`configuracion`** — Pares clave-valor para settings de la app

## Comandos Principales

```bash
# Instalar dependencias
npm install

# Poblar base de datos con datos demo
npm run seed

# Aplicar cambios de schema a la DB
npx drizzle-kit push

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

## Funcionalidades Implementadas

### 1. Dashboard (`/`)
- KPI cards: ingresos, gastos, balance, cuotas activas del mes
- Gráfico de barras: flujo de caja últimos 6 meses (Recharts)
- Gráfico de torta: gastos por categoría del mes
- Alertas de presupuesto inline (cuando se supera el umbral configurado)
- Últimos 6 gastos del mes
- Widget de cuotas activas con barras de progreso

### 2. Gastos (`/gastos`)
- Tabla filtrable por mes/año/miembro
- Modal de creación con auto-categorización por palabras clave
- Auto-categorización: al tipear la descripción, llama a `/api/categorizar` con debounce de 500ms
- Badge "Auto" en gastos auto-categorizados
- Soporte de tipo CUOTA: sub-formulario con concepto, cuota actual/total, fechas

### 3. Ingresos (`/ingresos`)
- CRUD completo por miembro
- Filtro por mes/año/miembro
- Soporte múltiples ingresos (sueldo, freelance, clases, etc.)

### 4. Cuotas (`/cuotas`)
- Listado de todos los planes de cuotas activos
- Barra de progreso por plan (cuotaActual/totalCuotas)
- Monto restante proyectado
- Botón "Registrar pago" → llama a `/api/cuotas/[id]/avanzar`
  - Avanza cuotaActual, actualiza fechaProximaCuota
  - Crea un nuevo registro de gasto automáticamente
  - Marca como inactiva si se completó

### 5. Presupuestos (`/presupuestos`)
- Límites por categoría para el mes seleccionado
- Barra de progreso mostrando % consumido
- Umbral de alerta configurable (por defecto 80%)
- Upsert: actualiza si ya existe presupuesto para esa categoría/mes/año

### 6. Escanear Ticket (`/escaner`)
- Upload de imagen (drag-and-drop o cámara en móvil)
- OCR con Tesseract.js en español
- Extrae: monto mayor detectado, fecha, nombre del comercio
- Pre-rellena el formulario de gasto con los datos extraídos

### 7. Reportes (`/reportes`)
- Selector de período (desde/hasta mes)
- Tab "Flujo de Caja": tabla mensual con ingresos/gastos/balance
- Tab "Por Categoría": breakdown con porcentajes
- Export a **PDF** (`@react-pdf/renderer`) y **Excel** (`xlsx`)

### 8. Configuración (`/configuracion`)
- Editar nombres y colores de cada miembro familiar
- El sidebar actualiza los avatars en tiempo real

## Motor de Auto-Categorización

Archivo: `src/lib/categorizacion.ts`

Algoritmo de scoring por palabras clave:
- Itera las categorías con sus `palabrasClave` (JSON array en DB)
- Normaliza texto (minúsculas + remover acentos)
- Asigna puntaje: keywords > 5 chars valen 2 pts, menores valen 1 pt
- Devuelve la categoría con mayor score + confianza (0.0–1.0)
- Se invoca desde `POST /api/gastos` (server) y `POST /api/categorizar` (cliente en tiempo real)

## Sistema de Alertas

Archivo: `src/lib/alertas.ts`

- Para cada presupuesto del mes, calcula `sum(gasto.monto)` del período
- Si `gastado / presupuesto >= alertaAlPct` → genera alerta
- Niveles: `advertencia` (>= 80%) y `critico` (>= 100%)
- Se muestra en el Dashboard como banners inline

## Datos Demo (seed)

Archivo: `scripts/seed.ts`

- **Familia:** Los García
- **Miembros:** Carlos (#6366f1 indigo) + Laura (#ec4899 rosa)
- **10 categorías** con palabras clave en español
- **6 meses** de ingresos y gastos (~$450k + $380k sueldos/mes)
- **5 cuotas activas:**
  - Auto Fiat Cronos: 18/48 cuotas × $45.000
  - Terreno Zona Norte: 6/120 cuotas × $62.000
  - Heladera Samsung 400L: 9/12 cuotas × $18.500
  - Seguro de Vida AXA: 4/12 cuotas × $8.500
  - Notebook HP 15": 3/18 cuotas × $28.000
- **Presupuestos** por categoría diseñados para disparar alertas en el mes actual

## Migración a PostgreSQL

Cuando estés listo para migrar de SQLite a PostgreSQL:

1. Instalar driver: `npm install pg @types/pg`
2. Actualizar `src/lib/db/index.ts`:
   ```typescript
   import { drizzle } from 'drizzle-orm/node-postgres'
   import { Pool } from 'pg'
   const pool = new Pool({ connectionString: process.env.DATABASE_URL })
   export const db = drizzle(pool, { schema })
   ```
3. Actualizar `drizzle.config.ts`: cambiar `dialect` a `postgresql`
4. Ejecutar `npx drizzle-kit push` con la nueva DB
5. Re-ejecutar el seed

El schema **no necesita cambios** — Drizzle abstrae las diferencias entre dialectos.

## Variables de Entorno

```env
# .env (actualmente no requerido para SQLite local)
DATABASE_URL="file:./data/familia.db"

# Para producción con PostgreSQL:
# DATABASE_URL="postgresql://user:password@host:5432/familia_budget"
```

## Notas Técnicas Importantes

### Windows ARM64
Este proyecto fue desarrollado en **Windows ARM64** (Surface/Snapdragon). Se usó Drizzle + better-sqlite3 porque:
- Prisma 5: binario `query_engine-windows.dll.node` es x64, no carga en ARM64 Node.js
- Prisma 7: requiere adapters (libsql/adapter-libsql) que tampoco tienen soporte ARM64 Windows
- better-sqlite3 v12+ tiene prebuilds nativos para `win32-arm64`

### Next.js + better-sqlite3
En `next.config.mjs` se debe externalizar `better-sqlite3` del bundle de webpack:
```js
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = [...(config.externals || []), 'better-sqlite3']
  }
  return config
}
```

### Zod v4
Esta versión usa `error.issues` en lugar de `error.errors` para los errores de validación.

### Recharts v3
El callback `formatter` del `Tooltip` recibe `value: number | string`, no solo `number`.

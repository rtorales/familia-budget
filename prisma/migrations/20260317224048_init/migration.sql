-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL DEFAULT 'Mi Familia',
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "locale" TEXT NOT NULL DEFAULT 'es-AR',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Miembro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'contribuidor',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Miembro_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "icono" TEXT NOT NULL DEFAULT '💰',
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "esSistema" BOOLEAN NOT NULL DEFAULT false,
    "palabrasClave" TEXT NOT NULL DEFAULT '[]',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miembroId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "esRecurrente" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Ingreso_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miembroId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CASUAL',
    "ticketImagen" TEXT,
    "ticketTextoOcr" TEXT,
    "categorizacionAuto" BOOLEAN NOT NULL DEFAULT false,
    "confianzaCategoria" REAL,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Gasto_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gastoId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoTotal" REAL NOT NULL,
    "montoCuota" REAL NOT NULL,
    "cuotaActual" INTEGER NOT NULL,
    "totalCuotas" INTEGER NOT NULL,
    "cuotasRestantes" INTEGER NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaProximaCuota" DATETIME NOT NULL,
    "frecuencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Cuota_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoriaId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "alertaAlPct" REAL NOT NULL DEFAULT 0.80,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Presupuesto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "clave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_gastoId_key" ON "Cuota"("gastoId");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_categoriaId_mes_anio_key" ON "Presupuesto"("categoriaId", "mes", "anio");

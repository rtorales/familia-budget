import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const libsql = createClient({ url: `file:${path.resolve('./prisma/dev.db')}` } as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaLibSql(libsql as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Sembrando datos de demostración...')

  // Clean existing data
  await prisma.configuracion.deleteMany()
  await prisma.presupuesto.deleteMany()
  await prisma.cuota.deleteMany()
  await prisma.gasto.deleteMany()
  await prisma.ingreso.deleteMany()
  await prisma.categoria.deleteMany()
  await prisma.miembro.deleteMany()
  await prisma.familia.deleteMany()

  // Create family
  const familia = await prisma.familia.create({
    data: {
      nombre: 'Los García',
      moneda: 'ARS',
      locale: 'es-AR',
    },
  })

  // Create family members
  const carlos = await prisma.miembro.create({
    data: {
      familiaId: familia.id,
      nombre: 'Carlos',
      rol: 'admin',
      color: '#6366f1',
    },
  })

  const laura = await prisma.miembro.create({
    data: {
      familiaId: familia.id,
      nombre: 'Laura',
      rol: 'contribuidor',
      color: '#ec4899',
    },
  })

  // Create categories
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: {
        nombre: 'Alimentación',
        icono: '🛒',
        color: '#22c55e',
        esSistema: true,
        palabrasClave: JSON.stringify(['supermercado', 'carrefour', 'dia', 'coto', 'verduleria', 'panaderia', 'almacen', 'mercado', 'jumbo', 'disco']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Transporte',
        icono: '🚗',
        color: '#3b82f6',
        esSistema: true,
        palabrasClave: JSON.stringify(['nafta', 'ypf', 'shell', 'axion', 'peaje', 'tren', 'subte', 'remis', 'uber', 'combustible']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Salud',
        icono: '🏥',
        color: '#ef4444',
        esSistema: true,
        palabrasClave: JSON.stringify(['farmacia', 'doctor', 'medico', 'consulta', 'osde', 'obra social', 'clinica', 'hospital', 'dentista', 'laboratorio']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Educación',
        icono: '📚',
        color: '#f59e0b',
        esSistema: true,
        palabrasClave: JSON.stringify(['colegio', 'jardin', 'escuela', 'universidad', 'libros', 'utiles', 'academia']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Entretenimiento',
        icono: '🎬',
        color: '#8b5cf6',
        esSistema: true,
        palabrasClave: JSON.stringify(['netflix', 'spotify', 'disney', 'cine', 'restaurant', 'bar', 'delivery', 'pedidosya', 'rappi', 'teatro']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Servicios',
        icono: '💡',
        color: '#06b6d4',
        esSistema: true,
        palabrasClave: JSON.stringify(['edesur', 'edenor', 'metrogas', 'aysa', 'internet', 'fibertel', 'claro', 'personal', 'movistar', 'luz', 'gas', 'agua']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Cuotas y Créditos',
        icono: '💳',
        color: '#f97316',
        esSistema: true,
        palabrasClave: JSON.stringify(['cuota', 'prestamo', 'tarjeta', 'financiacion', 'credito', 'banco']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Hogar',
        icono: '🏠',
        color: '#84cc16',
        esSistema: true,
        palabrasClave: JSON.stringify(['ferreteria', 'pintura', 'muebles', 'limpieza', 'fravega', 'garbarino', 'electrodomestico']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Seguros',
        icono: '🛡️',
        color: '#64748b',
        esSistema: true,
        palabrasClave: JSON.stringify(['seguro', 'axa', 'mapfre', 'sancor', 'allianz', 'zurich']),
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Ropa y Calzado',
        icono: '👗',
        color: '#ec4899',
        esSistema: true,
        palabrasClave: JSON.stringify(['ropa', 'zapatillas', 'calzado', 'zara', 'indumentaria', 'remera', 'zapatos']),
      },
    }),
  ])

  const [catAlimentacion, catTransporte, catSalud, catEducacion, catEntretenimiento, catServicios, catCuotas, catHogar, catSeguros, catRopa] = categorias

  // Generate 6 months of data
  const hoy = new Date()

  for (let mesesAtras = 5; mesesAtras >= 0; mesesAtras--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1)
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()

    // --- INCOMES ---
    // Carlos: salary + occasional freelance
    await prisma.ingreso.create({
      data: {
        miembroId: carlos.id,
        concepto: 'Sueldo mensual',
        monto: 450000 + Math.floor(Math.random() * 20000),
        fecha: new Date(anio, mes - 1, 5),
        esRecurrente: true,
      },
    })

    if (Math.random() > 0.4) {
      await prisma.ingreso.create({
        data: {
          miembroId: carlos.id,
          concepto: 'Trabajo freelance',
          monto: 60000 + Math.floor(Math.random() * 40000),
          fecha: new Date(anio, mes - 1, 15 + Math.floor(Math.random() * 10)),
          esRecurrente: false,
        },
      })
    }

    // Laura: salary + private lessons
    await prisma.ingreso.create({
      data: {
        miembroId: laura.id,
        concepto: 'Sueldo mensual',
        monto: 380000 + Math.floor(Math.random() * 15000),
        fecha: new Date(anio, mes - 1, 7),
        esRecurrente: true,
      },
    })

    await prisma.ingreso.create({
      data: {
        miembroId: laura.id,
        concepto: 'Clases particulares',
        monto: 45000 + Math.floor(Math.random() * 30000),
        fecha: new Date(anio, mes - 1, 25),
        esRecurrente: true,
      },
    })

    // --- EXPENSES ---
    const miembros = [carlos, laura]
    const getMiembro = () => miembros[Math.floor(Math.random() * miembros.length)]

    // Alimentación (highest category)
    const alimentacionItems = [
      { desc: 'Supermercado Carrefour', montoBase: 35000 },
      { desc: 'Verdulería Don José', montoBase: 8000 },
      { desc: 'Panadería El Trigo', montoBase: 4000 },
      { desc: 'Almacén La Esquina', montoBase: 5000 },
      { desc: 'Supermercado DIA', montoBase: 18000 },
    ]
    for (const item of alimentacionItems) {
      await prisma.gasto.create({
        data: {
          miembroId: getMiembro().id,
          categoriaId: catAlimentacion.id,
          descripcion: item.desc,
          monto: item.montoBase + Math.floor(Math.random() * item.montoBase * 0.3),
          fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
          tipo: 'CASUAL',
          categorizacionAuto: true,
          confianzaCategoria: 0.9,
        },
      })
    }

    // Transporte
    await prisma.gasto.create({
      data: {
        miembroId: carlos.id,
        categoriaId: catTransporte.id,
        descripcion: 'Nafta YPF',
        monto: 22000 + Math.floor(Math.random() * 5000),
        fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 10) + 1),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.95,
      },
    })
    await prisma.gasto.create({
      data: {
        miembroId: carlos.id,
        categoriaId: catTransporte.id,
        descripcion: 'Peaje Acceso Norte',
        monto: 3500 + Math.floor(Math.random() * 1000),
        fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.85,
      },
    })
    if (Math.random() > 0.5) {
      await prisma.gasto.create({
        data: {
          miembroId: laura.id,
          categoriaId: catTransporte.id,
          descripcion: 'Uber - viaje trabajo',
          monto: 2500 + Math.floor(Math.random() * 1500),
          fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
          tipo: 'CASUAL',
          categorizacionAuto: true,
          confianzaCategoria: 0.9,
        },
      })
    }

    // Servicios
    await prisma.gasto.create({
      data: {
        miembroId: carlos.id,
        categoriaId: catServicios.id,
        descripcion: 'Factura Edenor',
        monto: 18000 + Math.floor(Math.random() * 5000),
        fecha: new Date(anio, mes - 1, 10),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.98,
      },
    })
    await prisma.gasto.create({
      data: {
        miembroId: carlos.id,
        categoriaId: catServicios.id,
        descripcion: 'Metrogas',
        monto: 12000 + Math.floor(Math.random() * 4000),
        fecha: new Date(anio, mes - 1, 12),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.98,
      },
    })
    await prisma.gasto.create({
      data: {
        miembroId: laura.id,
        categoriaId: catServicios.id,
        descripcion: 'Internet Fibertel',
        monto: 8500,
        fecha: new Date(anio, mes - 1, 8),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.99,
      },
    })

    // Entretenimiento
    await prisma.gasto.create({
      data: {
        miembroId: laura.id,
        categoriaId: catEntretenimiento.id,
        descripcion: 'Netflix',
        monto: 3200,
        fecha: new Date(anio, mes - 1, 3),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.99,
      },
    })
    if (Math.random() > 0.3) {
      await prisma.gasto.create({
        data: {
          miembroId: getMiembro().id,
          categoriaId: catEntretenimiento.id,
          descripcion: 'Delivery PedidosYa',
          monto: 8000 + Math.floor(Math.random() * 4000),
          fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
          tipo: 'CASUAL',
          categorizacionAuto: true,
          confianzaCategoria: 0.88,
        },
      })
    }
    if (Math.random() > 0.6) {
      await prisma.gasto.create({
        data: {
          miembroId: getMiembro().id,
          categoriaId: catEntretenimiento.id,
          descripcion: 'Restaurante familiar',
          monto: 25000 + Math.floor(Math.random() * 10000),
          fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
          tipo: 'CASUAL',
          categorizacionAuto: false,
        },
      })
    }

    // Educación
    await prisma.gasto.create({
      data: {
        miembroId: laura.id,
        categoriaId: catEducacion.id,
        descripcion: 'Cuota colegio privado',
        monto: 45000,
        fecha: new Date(anio, mes - 1, 5),
        tipo: 'CASUAL',
        categorizacionAuto: true,
        confianzaCategoria: 0.85,
      },
    })

    // Salud
    if (Math.random() > 0.4) {
      await prisma.gasto.create({
        data: {
          miembroId: getMiembro().id,
          categoriaId: catSalud.id,
          descripcion: 'Farmacia',
          monto: 8000 + Math.floor(Math.random() * 6000),
          fecha: new Date(anio, mes - 1, Math.floor(Math.random() * 28) + 1),
          tipo: 'CASUAL',
          categorizacionAuto: true,
          confianzaCategoria: 0.92,
        },
      })
    }

    // Budget limits
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catAlimentacion.id, mes, anio } },
      update: {},
      create: { categoriaId: catAlimentacion.id, mes, anio, monto: 120000, alertaAlPct: 0.80 },
    })
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catTransporte.id, mes, anio } },
      update: {},
      create: { categoriaId: catTransporte.id, mes, anio, monto: 60000, alertaAlPct: 0.80 },
    })
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catEntretenimiento.id, mes, anio } },
      update: {},
      create: { categoriaId: catEntretenimiento.id, mes, anio, monto: 40000, alertaAlPct: 0.80 },
    })
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catServicios.id, mes, anio } },
      update: {},
      create: { categoriaId: catServicios.id, mes, anio, monto: 50000, alertaAlPct: 0.80 },
    })
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catSalud.id, mes, anio } },
      update: {},
      create: { categoriaId: catSalud.id, mes, anio, monto: 30000, alertaAlPct: 0.80 },
    })
    await prisma.presupuesto.upsert({
      where: { categoriaId_mes_anio: { categoriaId: catEducacion.id, mes, anio } },
      update: {},
      create: { categoriaId: catEducacion.id, mes, anio, monto: 55000, alertaAlPct: 0.80 },
    })
  }

  // --- INSTALLMENT PLANS (Cuotas) ---
  // Use current month for installment payments
  const mesActual = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()

  // 1. Auto Fiat Cronos - cuota 18 de 48
  const gastoAuto = await prisma.gasto.create({
    data: {
      miembroId: carlos.id,
      categoriaId: catCuotas.id,
      descripcion: 'Cuota auto Fiat Cronos',
      monto: 45000,
      fecha: new Date(anioActual, mesActual - 1, 10),
      tipo: 'CUOTA',
      notas: 'Cuota 18/48',
    },
  })
  await prisma.cuota.create({
    data: {
      gastoId: gastoAuto.id,
      concepto: 'Auto Fiat Cronos',
      montoTotal: 2160000,
      montoCuota: 45000,
      cuotaActual: 18,
      totalCuotas: 48,
      cuotasRestantes: 30,
      fechaInicio: new Date(anioActual - 1, mesActual - 1 - 5, 10),
      fechaProximaCuota: new Date(anioActual, mesActual, 10),
      frecuencia: 'MENSUAL',
      activa: true,
    },
  })

  // 2. Terreno Zona Norte - cuota 6 de 120
  const gastoTerreno = await prisma.gasto.create({
    data: {
      miembroId: carlos.id,
      categoriaId: catCuotas.id,
      descripcion: 'Cuota terreno Zona Norte',
      monto: 62000,
      fecha: new Date(anioActual, mesActual - 1, 5),
      tipo: 'CUOTA',
      notas: 'Cuota 6/120',
    },
  })
  await prisma.cuota.create({
    data: {
      gastoId: gastoTerreno.id,
      concepto: 'Terreno Zona Norte',
      montoTotal: 7440000,
      montoCuota: 62000,
      cuotaActual: 6,
      totalCuotas: 120,
      cuotasRestantes: 114,
      fechaInicio: new Date(anioActual, mesActual - 1 - 5, 5),
      fechaProximaCuota: new Date(anioActual, mesActual, 5),
      frecuencia: 'MENSUAL',
      activa: true,
      notas: 'Lote 15, Barrio Los Aromos',
    },
  })

  // 3. Heladera Samsung - cuota 9 de 12
  const gastoHeladera = await prisma.gasto.create({
    data: {
      miembroId: laura.id,
      categoriaId: catCuotas.id,
      descripcion: 'Cuota heladera Samsung',
      monto: 18500,
      fecha: new Date(anioActual, mesActual - 1, 15),
      tipo: 'CUOTA',
      notas: 'Cuota 9/12',
    },
  })
  await prisma.cuota.create({
    data: {
      gastoId: gastoHeladera.id,
      concepto: 'Heladera Samsung 400L',
      montoTotal: 222000,
      montoCuota: 18500,
      cuotaActual: 9,
      totalCuotas: 12,
      cuotasRestantes: 3,
      fechaInicio: new Date(anioActual, mesActual - 1 - 8, 15),
      fechaProximaCuota: new Date(anioActual, mesActual, 15),
      frecuencia: 'MENSUAL',
      activa: true,
    },
  })

  // 4. Seguro de vida AXA
  const gastoSeguro = await prisma.gasto.create({
    data: {
      miembroId: carlos.id,
      categoriaId: catSeguros.id,
      descripcion: 'Seguro de vida AXA',
      monto: 8500,
      fecha: new Date(anioActual, mesActual - 1, 1),
      tipo: 'CUOTA',
      notas: 'Cuota 4/12',
    },
  })
  await prisma.cuota.create({
    data: {
      gastoId: gastoSeguro.id,
      concepto: 'Seguro de Vida AXA',
      montoTotal: 102000,
      montoCuota: 8500,
      cuotaActual: 4,
      totalCuotas: 12,
      cuotasRestantes: 8,
      fechaInicio: new Date(anioActual, mesActual - 1 - 3, 1),
      fechaProximaCuota: new Date(anioActual, mesActual, 1),
      frecuencia: 'MENSUAL',
      activa: true,
      notas: 'Renovación anual en enero',
    },
  })

  // 5. Notebook HP - cuota 3 de 18
  const gastoNotebook = await prisma.gasto.create({
    data: {
      miembroId: laura.id,
      categoriaId: catCuotas.id,
      descripcion: 'Cuota Notebook HP',
      monto: 28000,
      fecha: new Date(anioActual, mesActual - 1, 20),
      tipo: 'CUOTA',
      notas: 'Cuota 3/18',
    },
  })
  await prisma.cuota.create({
    data: {
      gastoId: gastoNotebook.id,
      concepto: 'Notebook HP 15" i5',
      montoTotal: 504000,
      montoCuota: 28000,
      cuotaActual: 3,
      totalCuotas: 18,
      cuotasRestantes: 15,
      fechaInicio: new Date(anioActual, mesActual - 1 - 2, 20),
      fechaProximaCuota: new Date(anioActual, mesActual, 20),
      frecuencia: 'MENSUAL',
      activa: true,
    },
  })

  // App configuration
  await prisma.configuracion.upsert({
    where: { clave: 'familia_id' },
    update: { valor: familia.id },
    create: { clave: 'familia_id', valor: familia.id },
  })
  await prisma.configuracion.upsert({
    where: { clave: 'moneda' },
    update: { valor: 'ARS' },
    create: { clave: 'moneda', valor: 'ARS' },
  })

  console.log('✅ Datos sembrados exitosamente!')
  console.log(`   - Familia: ${familia.nombre}`)
  console.log(`   - Miembros: Carlos, Laura`)
  console.log(`   - ${categorias.length} categorías`)
  console.log(`   - 6 meses de ingresos y gastos`)
  console.log(`   - 5 planes de cuotas activos`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

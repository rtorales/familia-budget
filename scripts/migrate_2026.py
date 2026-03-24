#!/usr/bin/env python3
"""
Migration script: Load 2026 budget data from Excel into the familia-budget system.
Ricardo's data (columns A-I), saldo inicial 2026: 20,973,333
Today: March 24, 2026 | Current balance: 18,063,445

Strategy:
- Enero & Febrero: key individual items + grouped "Gastos varios"
- Marzo (paid up to today): individual important items + cuota plans
- Cuota plans: created with current state → project future impact automatically
"""

import psycopg2
import uuid
import sys
from datetime import datetime, date

DB_URL = "postgresql://postgres:QEWVxtpOfqBRIZQCwgQnAFFpnEnxemkv@shortline.proxy.rlwy.net:16504/railway"

# ─── IDs ──────────────────────────────────────────────────────────────────────
FAMILIA_ID   = 'tzltz895uki3bevw2jwspzbb'  # Torales Machado
RICARDO_ID   = 'o0n9372eiuizqsofomo2i9l2'
SOLE_ID      = 'xcdq1gf41dbuwk2dnfcg4bl4'

# Categories (Torales Machado family)
CAT_ALIMENTACION  = 'p7c971v3qra6zmj5nvmxhd3k'
CAT_TRANSPORTE    = 'xxerwsw1tsi265fg4ntdx1o2'
CAT_SALUD         = 'qsjq3d4hz0o159wyoz9ngtiv'
CAT_EDUCACION     = 'd8s1kti1h1sifslk447cuf0r'
CAT_ENTRET        = 'colpjjn148ym5wjm3w4tiydw'
CAT_SERVICIOS     = 'bt5l1tohvfojivcbbaf9amai'
CAT_CUOTAS        = 'obp89sfk1z78rccyg190hfsj'
CAT_HOGAR         = 'nm1rdi52lql9in31u8n7ckxk'
CAT_SEGUROS       = 'ogias8824bhbffin4iaimocf'
CAT_ROPA          = 'c1b1mapprxur13fbifa42lgu'

# ─── Helpers ──────────────────────────────────────────────────────────────────
def new_id():
    """Generate a 24-char lowercase hex ID (compatible with cuid2 format)."""
    return uuid.uuid4().hex[:24]

def d(year, month, day=1):
    return datetime(year, month, day)

now = datetime.now()

# ─── Connect ──────────────────────────────────────────────────────────────────
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# ─── Clean up existing sample data ────────────────────────────────────────────
print("Cleaning up sample/demo data for Ricardo's family...")

# Remove demo cuotas and their linked gastos
cur.execute("""
    DELETE FROM cuota WHERE gasto_id IN (
        SELECT id FROM gasto WHERE miembro_id IN (%s, %s)
    )
""", (RICARDO_ID, SOLE_ID))

cur.execute("DELETE FROM gasto WHERE miembro_id IN (%s, %s)", (RICARDO_ID, SOLE_ID))
cur.execute("DELETE FROM ingreso WHERE miembro_id IN (%s, %s)", (RICARDO_ID, SOLE_ID))

# Remove orphan sample cuotas (the demo ones)
cur.execute("""
    DELETE FROM cuota WHERE gasto_id NOT IN (SELECT id FROM gasto)
""")
print("  Cleaned.")

# ─── Helper to insert ingreso ──────────────────────────────────────────────────
def insert_ingreso(concepto, monto, fecha, es_recurrente=False, notas=None):
    iid = new_id()
    cur.execute("""
        INSERT INTO ingreso (id, miembro_id, concepto, monto, fecha, es_recurrente, notas, creado_en, actualizado_en)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (iid, RICARDO_ID, concepto, monto, fecha, es_recurrente, notas, now, now))
    return iid

# ─── Helper to insert gasto ───────────────────────────────────────────────────
def insert_gasto(descripcion, monto, fecha, cat_id, tipo='CASUAL', notas=None):
    gid = new_id()
    cur.execute("""
        INSERT INTO gasto (id, miembro_id, categoria_id, descripcion, monto, fecha, tipo,
                           categorizacion_auto, notas, creado_en, actualizado_en)
        VALUES (%s, %s, %s, %s, %s, %s, %s, false, %s, %s, %s)
    """, (gid, RICARDO_ID, cat_id, descripcion, monto, fecha, tipo, notas, now, now))
    return gid

# ─── Helper to insert cuota plan ──────────────────────────────────────────────
def insert_cuota(gasto_id, concepto, monto_cuota, cuota_actual, total_cuotas,
                 fecha_inicio, fecha_proxima, notas=None):
    cuotas_restantes = total_cuotas - cuota_actual
    monto_total = monto_cuota * total_cuotas
    cid = new_id()
    cur.execute("""
        INSERT INTO cuota (id, gasto_id, concepto, monto_total, monto_cuota,
                           cuota_actual, total_cuotas, cuotas_restantes,
                           fecha_inicio, fecha_proxima_cuota, frecuencia,
                           activa, notas, creado_en, actualizado_en)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'MENSUAL', %s, %s, %s, %s)
    """, (cid, gasto_id, concepto, monto_total, monto_cuota,
          cuota_actual, total_cuotas, cuotas_restantes,
          fecha_inicio, fecha_proxima, cuotas_restantes > 0, notas, now, now))
    return cid

# ════════════════════════════════════════════════════════════════════════════════
# ENERO 2026
# ════════════════════════════════════════════════════════════════════════════════
print("\n=== ENERO 2026 ===")

# INGRESOS
insert_ingreso("Sueldo", 21_840_000, d(2026, 1, 1), True, "Sueldo mensual")
insert_ingreso("BECAL - Beca", 24_619_000, d(2026, 1, 20), False, "Pago beca BECAL")

# GASTOS ENERO - Cuotas y préstamos importantes
insert_gasto("Auto Sole - cuota 41/48", 2_590_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Auto Sole Camioneta - cuota 1/48", 2_660_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Auto Sole Camioneta - cuota 2/48 (adelantado)", 909_000, d(2026, 1, 28), CAT_CUOTAS)
insert_gasto("Préstamo Aguinaldo - cuota 1/6", 2_562_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Préstamo 6M emergencia - cuota 7/12", 526_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Préstamo 8M mamá - cuota 12/12 (FINALIZA)", 702_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Préstamo ITAU - cuota 7/12", 335_096, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Cuota TC Sole - cuota 3/18", 1_375_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Cuota Casa (hipoteca) - cuota 3/360", 1_723_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Adicional Casa - cuota 2/10", 1_000_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Bristol heladera + escritorio - cuota 4/18", 518_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Bristol Aire acondicionado - cuota 11/18", 393_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Ahorro programado UENO - cuota 6/12", 150_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Ahorro programado ITAU - cuota 6/12", 200_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Terreno SanBer - cuota 52/130", 450_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Terreno Pirayu - cuota 17/130", 500_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Celular - cuota 13/15", 648_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("Celular - cuota 14/15 (adelantado)", 648_000, d(2026, 1, 28), CAT_CUOTAS)
insert_gasto("Seguro Santa Clara - cuota 10/12", 705_000, d(2026, 1, 5), CAT_SEGUROS)
insert_gasto("Seguro Camioneta - cuota 2/11", 442_000, d(2026, 1, 5), CAT_SEGUROS)
insert_gasto("Seguro Auto - cuota 7/11", 391_000, d(2026, 1, 5), CAT_SEGUROS)
insert_gasto("Seguro Casa - cuota 6/11", 73_000, d(2026, 1, 5), CAT_SEGUROS)
insert_gasto("Tupi Extractor cocina - cuota 9/12", 70_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Tupi Anafe - cuota 9/12", 89_000, d(2026, 1, 5), CAT_HOGAR)

# Servicios y gastos fijos Enero
insert_gasto("TC UENO - pago enero", 5_000_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("TC CU - pago enero", 1_500_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("TC ITAU - pago enero", 1_500_000, d(2026, 1, 5), CAT_CUOTAS)
insert_gasto("ANDE - electricidad enero", 551_000, d(2026, 1, 5), CAT_SERVICIOS)
insert_gasto("Niñera", 1_650_000, d(2026, 1, 5), CAT_SERVICIOS)
insert_gasto("Tigo teléfono + internet", 215_000, d(2026, 1, 5), CAT_SERVICIOS)
insert_gasto("Familia", 500_000, d(2026, 1, 5), CAT_HOGAR)
insert_gasto("Contabilidad", 450_000, d(2026, 1, 5), CAT_SERVICIOS)
insert_gasto("Agua + basura", 117_000, d(2026, 1, 5), CAT_SERVICIOS)
insert_gasto("Cuota Valentina - Taekwando", 125_000, d(2026, 1, 5), CAT_EDUCACION)

# Gastos notables Enero
insert_gasto("IPAD Sole", 2_700_000, d(2026, 1, 15), CAT_HOGAR)
insert_gasto("Terreno Escobar - inversión inicial", 1_300_000, d(2026, 1, 20), CAT_HOGAR, notas="Nuevo terreno barrio cerrado - pago inicial")
insert_gasto("Terreno Potrerito - recuperación título", 1_500_000, d(2026, 1, 25), CAT_HOGAR)
insert_gasto("Ahorro / inversión fondo mutuo - enero", 16_950_000, d(2026, 1, 20), CAT_CUOTAS, notas="Aportes fondo mutuo + ahorros programados enero")
insert_gasto("Reparación Camioneta - bulbo aceite y levantavidrios", 380_000, d(2026, 1, 28), CAT_TRANSPORTE)
insert_gasto("Sole - multa, pago contadora, préstamo", 550_000, d(2026, 1, 28), CAT_SERVICIOS)

# Gastos varios agrupados Enero (shopping, comidas, combustible, entretenimiento, etc.)
insert_gasto("Gastos varios Enero", 3_800_000, d(2026, 1, 15), CAT_ENTRET,
             notas="Unicentro, Viaje San Juan, cenas, combustible, shopping, circo, profe Valentina, supermarket, etc.")

print("  Enero: OK")

# ════════════════════════════════════════════════════════════════════════════════
# FEBRERO 2026
# ════════════════════════════════════════════════════════════════════════════════
print("\n=== FEBRERO 2026 ===")

# INGRESOS
insert_ingreso("Sueldo", 21_840_000, d(2026, 2, 1), True)
insert_ingreso("Excedentes CU", 880_000, d(2026, 2, 28), False, "Excedentes acreditados CU")

# GASTOS FEBRERO - Cuotas y préstamos
insert_gasto("Auto Sole - cuota 42/48", 2_590_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Préstamo Aguinaldo - cuota 2/6", 2_562_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Préstamo 6M emergencia - cuota 8/12 (ya pago en enero)", 0, d(2026, 2, 5), CAT_CUOTAS,
             notas="Pagado anticipadamente en enero")
insert_gasto("Préstamo ITAU - cuota 8/12", 335_096, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Cuota TC Sole - cuota 4/18", 1_375_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Cuota Casa (hipoteca) - cuota 4/360", 1_723_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Adicional Casa - cuota 3/10", 1_000_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Bristol heladera + escritorio - cuota 5/18", 518_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Bristol Aire acondicionado - cuota 12/18", 392_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Ahorro programado UENO - cuota 7/9", 150_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Ahorro programado ITAU - cuota 7/12", 200_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Terreno SanBer - cuota 53/130", 450_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Terreno Pirayu - cuota 18/130", 500_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Seguro Santa Clara - cuota 11/12", 697_500, d(2026, 2, 5), CAT_SEGUROS)
insert_gasto("Seguro Camioneta - cuota 3/11", 442_000, d(2026, 2, 5), CAT_SEGUROS)
insert_gasto("Seguro Auto - cuota 8/11", 391_000, d(2026, 2, 5), CAT_SEGUROS)
insert_gasto("Seguro Casa - cuota 7/11", 73_000, d(2026, 2, 5), CAT_SEGUROS)
insert_gasto("Tupi Extractor cocina - cuota 10/12", 70_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Tupi Anafe - cuota 10/12", 89_000, d(2026, 2, 5), CAT_HOGAR)

# Servicios y gastos fijos Febrero
insert_gasto("TC UENO - pago febrero", 4_000_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("TC CU - pago febrero", 1_400_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("TC ITAU - pago febrero", 1_500_000, d(2026, 2, 5), CAT_CUOTAS)
insert_gasto("Niñera", 1_550_000, d(2026, 2, 5), CAT_SERVICIOS)
insert_gasto("Familia", 500_000, d(2026, 2, 5), CAT_HOGAR)
insert_gasto("Contabilidad", 450_000, d(2026, 2, 5), CAT_SERVICIOS)
insert_gasto("Tigo teléfono + internet", 225_000, d(2026, 2, 5), CAT_SERVICIOS)
insert_gasto("Cuota Valentina - Taekwando", 125_000, d(2026, 2, 5), CAT_EDUCACION)
insert_gasto("Basura + agua", 50_000, d(2026, 2, 5), CAT_SERVICIOS)

# Gastos notables Febrero
insert_gasto("Kit de herramientas (pago TC)", 850_000, d(2026, 2, 15), CAT_HOGAR)
insert_gasto("Constancia facultad Sole", 600_000, d(2026, 2, 20), CAT_EDUCACION)
insert_gasto("Pago deudas Sole / TC Sole", 1_250_000, d(2026, 2, 28), CAT_CUOTAS)

# Gastos varios agrupados Febrero
insert_gasto("Gastos varios Febrero", 2_800_000, d(2026, 2, 15), CAT_ENTRET,
             notas="Supermercado, Unicentro, combustible, donaciones, pesca, cenas, shopping, etc.")

print("  Febrero: OK")

# ════════════════════════════════════════════════════════════════════════════════
# MARZO 2026 (pagados hasta el 24/03 con X)
# ════════════════════════════════════════════════════════════════════════════════
print("\n=== MARZO 2026 (hasta hoy) ===")

# INGRESOS Marzo
insert_ingreso("Sueldo", 21_840_000, d(2026, 3, 1), True)
insert_ingreso("Sueldo Sole - liquidación", 6_000_000, d(2026, 3, 10), False, "Liquidación sueldo Sole")
insert_ingreso("Okara - Proyecto Proquitec 50% inicial", 10_000_000, d(2026, 3, 12), False, "Cobro proyecto Proquitec")
insert_ingreso("Préstamo Universitaria - Notebook", 12_000_000, d(2026, 3, 20), False, "Préstamo universidad para compra notebook")
insert_ingreso("Universitaria - Préstamo Emergencia", 500_000, d(2026, 3, 5), False, "Préstamo emergencia universitaria")
insert_ingreso("Fondo mutuo - rescate inversión", 17_155_000, d(2026, 3, 10), False, "Rescate parcial fondo mutuo para gastos marzo")

# GASTOS MARZO - cuotas (estos son los que se vinculan a los planes de cuota)
# Nota: los gastos tipo CUOTA en marzo serán los que linkean con los planes activos

# ─ Seguro Camioneta (4/11)
g_seg_camioneta_mar = insert_gasto("Seguro Camioneta - cuota 4/11", 442_000, d(2026, 3, 5), CAT_SEGUROS, 'CUOTA')
# ─ Seguro Auto (9/11)
g_seg_auto_mar = insert_gasto("Seguro Auto - cuota 9/11", 391_000, d(2026, 3, 5), CAT_SEGUROS, 'CUOTA')
# ─ Seguro Casa (8/11)
g_seg_casa_mar = insert_gasto("Seguro Casa - cuota 8/11", 73_000, d(2026, 3, 5), CAT_SEGUROS, 'CUOTA')
# ─ Prestamo 6M emergencia (9/12)
g_prest_emerg_mar = insert_gasto("Préstamo 6M emergencia - cuota 9/12", 526_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Préstamo ITAU (10/12) - 2 cuotas en marzo
g_prest_itau_mar = insert_gasto("Préstamo ITAU - cuotas 9+10/12 (dos pagos)", 670_192, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Bristol heladera + escritorio (6/18)
g_bristol_hel_mar = insert_gasto("Bristol heladera + escritorio - cuota 6/18", 518_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Cuota TC Sole (5/18)
g_tc_sole_mar = insert_gasto("Cuota TC Sole - cuota 5/18", 1_375_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Ahorro programado UENO (8/12)
g_ahorro_ueno_mar = insert_gasto("Ahorro programado UENO - cuota 8/12", 150_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Ahorro programado ITAU (8/12)
g_ahorro_itau_mar = insert_gasto("Ahorro programado ITAU - cuota 8/12", 200_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Adicional Casa (4/10)
g_adic_casa_mar = insert_gasto("Adicional Casa - cuota 4/10", 1_000_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Cuota Casa hipoteca (5/360) - 2 cuotas pagadas en marzo
g_cuota_casa_mar = insert_gasto("Cuota Casa (hipoteca) - cuotas 4+5/360 (doble pago)", 3_446_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Tupi Extractor (11/12)
g_tupi_ext_mar = insert_gasto("Tupi Extractor cocina - cuota 11/12", 70_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Tupi Anafe (11/12)
g_tupi_anafe_mar = insert_gasto("Tupi Anafe - cuota 11/12", 89_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Terreno SanBer (cuotas 54+55/130)
g_terreno_sanber_mar = insert_gasto("Terreno SanBer - cuotas 54+55/130", 900_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Terreno Pirayu (cuotas 19+20/130)
g_terreno_pirayu_mar = insert_gasto("Terreno Pirayu - cuotas 19+20/130", 1_000_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Terreno Escobar (2/130)
g_terreno_escobar_mar = insert_gasto("Terreno Escobar - cuota 2/130", 1_300_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Auto Sole Camioneta (3/48) - restructuración en marzo
g_camioneta_mar = insert_gasto("Auto Sole Camioneta - cuota 3/48", 3_538_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA',
                                notas="Último pago antes de reestructuración en abril")
# ─ Préstamo Aguinaldo (3/6)
g_prest_aguin_mar = insert_gasto("Préstamo Aguinaldo - cuota 3/6", 2_562_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Auto Sole (43/48 - último antes de reestructuración)
g_auto_sole_mar = insert_gasto("Auto Sole - cuota 43/48 (último)", 2_590_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA',
                                notas="Préstamo reestructurado en abril")
# ─ Celular (15/15 - FINALIZA)
g_celular_mar = insert_gasto("Celular - cuota 15/15 (FINALIZA)", 648_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Bristol Licuadora (1/12 - NUEVA)
g_bristol_lic_mar = insert_gasto("Bristol Licuadora - cuota 1/12", 120_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ Bristol Sole (12/18)
g_bristol_sole_mar = insert_gasto("Bristol Sole - cuota 12/18", 60_000, d(2026, 3, 5), CAT_HOGAR, 'CUOTA')
# ─ IBA (4/8)
g_iba_mar = insert_gasto("IBA - cuota 4/8", 100_000, d(2026, 3, 5), CAT_CUOTAS, 'CUOTA')
# ─ Cuota Valentina Taekwando
g_valentina_mar = insert_gasto("Cuota Valentina - Taekwando mes 3", 125_000, d(2026, 3, 5), CAT_EDUCACION, 'CUOTA')

# Servicios y gastos fijos Marzo
insert_gasto("TC UENO - pago marzo", 5_000_000, d(2026, 3, 5), CAT_CUOTAS)
insert_gasto("TC CU - pago marzo", 1_500_000, d(2026, 3, 5), CAT_CUOTAS)
insert_gasto("TC ITAU - pago marzo", 736_000, d(2026, 3, 5), CAT_CUOTAS, notas="Pago parcial TC ITAU marzo")
insert_gasto("ANDE - electricidad marzo", 380_000, d(2026, 3, 5), CAT_SERVICIOS)
insert_gasto("Niñera", 1_500_000, d(2026, 3, 5), CAT_SERVICIOS)
insert_gasto("Familia", 500_000, d(2026, 3, 5), CAT_HOGAR)
insert_gasto("Contabilidad", 450_000, d(2026, 3, 5), CAT_SERVICIOS)
insert_gasto("Tigo teléfono + internet", 215_000, d(2026, 3, 5), CAT_SERVICIOS)
insert_gasto("Seguro Santa Clara - última cuota ciclo (incluida en seguro)", 697_500, d(2026, 3, 5), CAT_SEGUROS,
             notas="Cuota final del ciclo 2025-2026. Nuevo ciclo inicia abril")

# Gastos notables Marzo (grandes, >200K y significativos)
insert_gasto("Notebook HP - compra", 14_000_000, d(2026, 3, 20), CAT_HOGAR, notas="Compra notebook con préstamo universitaria")
insert_gasto("Reparación Camioneta - aire acondicionado", 950_000, d(2026, 3, 10), CAT_TRANSPORTE)
insert_gasto("Reparación Camioneta - varios", 2_570_000, d(2026, 3, 15), CAT_TRANSPORTE)
insert_gasto("Mueble Cocina - 50% inicial", 2_500_000, d(2026, 3, 10), CAT_HOGAR)
insert_gasto("Cuota Casa Sole Amerina", 900_000, d(2026, 3, 10), CAT_CUOTAS)
insert_gasto("Libros escuela", 350_000, d(2026, 3, 8), CAT_EDUCACION)
insert_gasto("Terreno Escobar - cuota regular", 1_300_000, d(2026, 3, 15), CAT_HOGAR)
insert_gasto("Pago deudas Sole / TC Sole marzo", 1_500_000, d(2026, 3, 20), CAT_CUOTAS)
insert_gasto("Odontología - carillas", 1_000_000, d(2026, 3, 18), CAT_SALUD)
insert_gasto("Reserva bungalow campamento", 200_000, d(2026, 3, 15), CAT_ENTRET)
insert_gasto("Transferencia camioneta 50% faltante", 2_175_000, d(2026, 3, 22), CAT_TRANSPORTE, notas="Pago pendiente sin X aún")

# Gastos varios agrupados Marzo
insert_gasto("Gastos varios Marzo", 1_800_000, d(2026, 3, 15), CAT_ENTRET,
             notas="Sushi, Miel, reparaciones, ferreterías, gastos viaje pesca, creatina, gastos casa, etc.")

print("  Marzo: OK")

# ════════════════════════════════════════════════════════════════════════════════
# CUOTA PLANS - Estado actual (24 de marzo 2026)
# ════════════════════════════════════════════════════════════════════════════════
print("\n=== CREANDO PLANES DE CUOTA (estado actual -> impacto futuro) ===")

# Próxima fecha de pago: 1 de Abril 2026
prox_abril = datetime(2026, 4, 1)

# ─── 1. Terreno SanBer: cuota 55/130, 450K/mes ────────────────────────────────
insert_cuota(
    gasto_id=g_terreno_sanber_mar,
    concepto="Terreno San Bernardino",
    monto_cuota=450_000,
    cuota_actual=55,
    total_cuotas=130,
    fecha_inicio=datetime(2021, 8, 1),
    fecha_proxima=prox_abril,
    notas="Cuota mensual terreno SanBer. Pagado hasta cuota 55 en marzo 2026."
)

# ─── 2. Terreno Pirayu: cuota 20/130, 500K/mes ────────────────────────────────
insert_cuota(
    gasto_id=g_terreno_pirayu_mar,
    concepto="Cuota Terreno Pirayu",
    monto_cuota=500_000,
    cuota_actual=20,
    total_cuotas=130,
    fecha_inicio=datetime(2024, 7, 1),
    fecha_proxima=prox_abril,
    notas="Cuota mensual terreno Pirayu. Pagado hasta cuota 20 en marzo 2026."
)

# ─── 3. Terreno Escobar: cuota 2/130, 650K/mes ────────────────────────────────
insert_cuota(
    gasto_id=g_terreno_escobar_mar,
    concepto="Terreno Escobar (Barrio Cerrado)",
    monto_cuota=650_000,
    cuota_actual=2,
    total_cuotas=130,
    fecha_inicio=datetime(2026, 1, 1),
    fecha_proxima=prox_abril,
    notas="Nuevo terreno barrio cerrado. Cuotas regulares 650K/mes desde marzo."
)

# ─── 4. Seguro Santa Clara: NUEVO ciclo 0/12 desde Abril ─────────────────────
# Crear gasto placeholder para el nuevo ciclo de seguro
g_seg_santa_clara_new = insert_gasto(
    "Seguro Santa Clara - cuota 1/12 (nuevo ciclo abril 2026)",
    705_000, prox_abril, CAT_SEGUROS, 'CUOTA')
insert_cuota(
    gasto_id=g_seg_santa_clara_new,
    concepto="Seguro Santa Clara",
    monto_cuota=705_000,
    cuota_actual=0,
    total_cuotas=12,
    fecha_inicio=datetime(2026, 4, 1),
    fecha_proxima=prox_abril,
    notas="Nuevo ciclo anual. El ciclo anterior (10-11/12) fue pagado en ene-mar 2026."
)

# ─── 5. Seguro Camioneta: cuota 4/11, 442K/mes ────────────────────────────────
insert_cuota(
    gasto_id=g_seg_camioneta_mar,
    concepto="Seguro Camioneta",
    monto_cuota=442_000,
    cuota_actual=4,
    total_cuotas=11,
    fecha_inicio=datetime(2025, 12, 1),
    fecha_proxima=prox_abril,
    notas="Póliza anual. Ciclo actual dic 2025 - oct 2026."
)

# ─── 6. Seguro Casa: cuota 8/11, 73K/mes ─────────────────────────────────────
insert_cuota(
    gasto_id=g_seg_casa_mar,
    concepto="Seguro Casa",
    monto_cuota=73_000,
    cuota_actual=8,
    total_cuotas=11,
    fecha_inicio=datetime(2025, 8, 1),
    fecha_proxima=prox_abril,
    notas="Póliza anual. Ciclo actual ago 2025 - jun 2026."
)

# ─── 7. Seguro Auto: cuota 9/11, 391K/mes ────────────────────────────────────
insert_cuota(
    gasto_id=g_seg_auto_mar,
    concepto="Seguro Auto",
    monto_cuota=391_000,
    cuota_actual=9,
    total_cuotas=11,
    fecha_inicio=datetime(2025, 7, 1),
    fecha_proxima=prox_abril,
    notas="Póliza anual. Ciclo actual jul 2025 - may 2026. Renueva en junio."
)

# ─── 8. Reestructuración Préstamo (Auto+Camioneta): 0/48 desde Abril ─────────
g_reestruct = insert_gasto(
    "Reestructuración Préstamo - cuota 1/48 (NUEVO desde abril)",
    2_660_000, prox_abril, CAT_CUOTAS, 'CUOTA',
    notas="Consolida préstamos Auto Sole + Auto Camioneta + Aguinaldo"
)
insert_cuota(
    gasto_id=g_reestruct,
    concepto="Reestructuración Préstamo (Auto+Camioneta)",
    monto_cuota=2_660_000,
    cuota_actual=0,
    total_cuotas=48,
    fecha_inicio=datetime(2026, 4, 1),
    fecha_proxima=prox_abril,
    notas="Préstamo reestructurado desde abril 2026. Consolida Auto Sole 43/48, Camioneta 3/48 y Préstamo Aguinaldo."
)

# ─── 9. Préstamo 6M emergencia: cuota 9/12, 526K/mes ─────────────────────────
insert_cuota(
    gasto_id=g_prest_emerg_mar,
    concepto="Préstamo 6M emergencia",
    monto_cuota=526_000,
    cuota_actual=9,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 7, 1),
    fecha_proxima=prox_abril,
    notas="Préstamo emergencia 6M. Finaliza junio 2026."
)

# ─── 10. Préstamo ITAU: cuota 10/12, 335K/mes ────────────────────────────────
insert_cuota(
    gasto_id=g_prest_itau_mar,
    concepto="Préstamo ITAU",
    monto_cuota=335_096,
    cuota_actual=10,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 7, 1),
    fecha_proxima=prox_abril,
    notas="Préstamo ITAU. Finaliza junio 2026. Renueva julio 2026."
)

# ─── 11. Bristol heladera + escritorio: cuota 6/18, 518K/mes ─────────────────
insert_cuota(
    gasto_id=g_bristol_hel_mar,
    concepto="Bristol heladera + escritorio",
    monto_cuota=518_000,
    cuota_actual=6,
    total_cuotas=18,
    fecha_inicio=datetime(2025, 9, 1),
    fecha_proxima=prox_abril,
    notas="Compra Bristol heladera y escritorio en 18 cuotas."
)

# ─── 12. Cuota TC Sole: cuota 5/18, 1.375M/mes ───────────────────────────────
insert_cuota(
    gasto_id=g_tc_sole_mar,
    concepto="Cuota TC Sole (UENO/CU)",
    monto_cuota=1_375_000,
    cuota_actual=5,
    total_cuotas=18,
    fecha_inicio=datetime(2025, 10, 1),
    fecha_proxima=prox_abril,
    notas="Pago cuota TC Sole (tarjeta de Sole). 18 cuotas desde oct 2025."
)

# ─── 13. Ahorro programado UENO: cuota 8/12, 150K/mes ────────────────────────
insert_cuota(
    gasto_id=g_ahorro_ueno_mar,
    concepto="Ahorro programado UENO",
    monto_cuota=150_000,
    cuota_actual=8,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 7, 1),
    fecha_proxima=prox_abril,
    notas="Ahorro programado banco UENO. Ciclo jul 2025 - jun 2026."
)

# ─── 14. Ahorro programado ITAU: cuota 8/12, 200K/mes ────────────────────────
insert_cuota(
    gasto_id=g_ahorro_itau_mar,
    concepto="Ahorro programado ITAU",
    monto_cuota=200_000,
    cuota_actual=8,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 7, 1),
    fecha_proxima=prox_abril,
    notas="Ahorro programado banco ITAU. Ciclo jul 2025 - jun 2026."
)

# ─── 15. Adicional Casa: cuota 4/10, 1M/mes ──────────────────────────────────
insert_cuota(
    gasto_id=g_adic_casa_mar,
    concepto="Adicional Casa",
    monto_cuota=1_000_000,
    cuota_actual=4,
    total_cuotas=10,
    fecha_inicio=datetime(2025, 11, 1),
    fecha_proxima=prox_abril,
    notas="Cuota adicional casa. Finaliza octubre 2026."
)

# ─── 16. Cuota Casa (hipoteca): cuota 5/360, 1.723M/mes ──────────────────────
insert_cuota(
    gasto_id=g_cuota_casa_mar,
    concepto="Cuota Casa (hipoteca 30 años)",
    monto_cuota=1_723_000,
    cuota_actual=5,
    total_cuotas=360,
    fecha_inicio=datetime(2025, 10, 1),
    fecha_proxima=prox_abril,
    notas="Hipoteca casa 30 años (360 cuotas). Inicio oct 2025."
)

# ─── 17. Tupi Extractor cocina: cuota 11/12, 70K/mes ─────────────────────────
insert_cuota(
    gasto_id=g_tupi_ext_mar,
    concepto="Tupi Extractor cocina",
    monto_cuota=70_000,
    cuota_actual=11,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 5, 1),
    fecha_proxima=prox_abril,
    notas="Cuota extractor cocina Tupi. Finaliza abril 2026."
)

# ─── 18. Tupi Anafe: cuota 11/12, 89K/mes ────────────────────────────────────
insert_cuota(
    gasto_id=g_tupi_anafe_mar,
    concepto="Tupi Anafe",
    monto_cuota=89_000,
    cuota_actual=11,
    total_cuotas=12,
    fecha_inicio=datetime(2025, 5, 1),
    fecha_proxima=prox_abril,
    notas="Cuota anafe Tupi. Finaliza abril 2026."
)

# ─── 19. IBA: cuota 4/8, 100K/mes ────────────────────────────────────────────
insert_cuota(
    gasto_id=g_iba_mar,
    concepto="IBA",
    monto_cuota=100_000,
    cuota_actual=4,
    total_cuotas=8,
    fecha_inicio=datetime(2025, 12, 1),
    fecha_proxima=prox_abril,
    notas="Cuota IBA. Finaliza julio 2026."
)

# ─── 20. Bristol Licuadora: cuota 1/12, 120K/mes ─────────────────────────────
insert_cuota(
    gasto_id=g_bristol_lic_mar,
    concepto="Bristol Licuadora",
    monto_cuota=120_000,
    cuota_actual=1,
    total_cuotas=12,
    fecha_inicio=datetime(2026, 3, 1),
    fecha_proxima=prox_abril,
    notas="Licuadora Bristol en 12 cuotas. Iniciada marzo 2026."
)

# ─── 21. Bristol Sole: cuota 12/18, 60K/mes ──────────────────────────────────
insert_cuota(
    gasto_id=g_bristol_sole_mar,
    concepto="Bristol Sole",
    monto_cuota=60_000,
    cuota_actual=12,
    total_cuotas=18,
    fecha_inicio=datetime(2025, 4, 1),
    fecha_proxima=prox_abril,
    notas="Compra Bristol a nombre de Sole. Finaliza septiembre 2026."
)

# ─── 22. Cuota Valentina Taekwando: cuota 3/120, 125K/mes ────────────────────
insert_cuota(
    gasto_id=g_valentina_mar,
    concepto="Cuota Valentina - Taekwando",
    monto_cuota=125_000,
    cuota_actual=3,
    total_cuotas=120,
    fecha_inicio=datetime(2026, 1, 1),
    fecha_proxima=prox_abril,
    notas="Mensualidad taekwando de Valentina. Tratado como gasto recurrente mensual."
)

# ─── Commit ───────────────────────────────────────────────────────────────────
conn.commit()
print("\nMigracion completada exitosamente!")
print("\n=== RESUMEN ===")

# Print stats
cur.execute("SELECT COUNT(*) FROM ingreso WHERE miembro_id = %s", (RICARDO_ID,))
print(f"  Ingresos insertados: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM gasto WHERE miembro_id = %s", (RICARDO_ID,))
print(f"  Gastos insertados: {cur.fetchone()[0]}")
cur.execute("""
    SELECT COUNT(*) FROM cuota c
    JOIN gasto g ON c.gasto_id = g.id
    WHERE g.miembro_id = %s
""", (RICARDO_ID,))
print(f"  Planes de cuota creados: {cur.fetchone()[0]}")

cur.execute("""
    SELECT c.concepto, c.cuota_actual, c.total_cuotas, c.cuotas_restantes, c.monto_cuota
    FROM cuota c JOIN gasto g ON c.gasto_id = g.id
    WHERE g.miembro_id = %s
    ORDER BY c.cuotas_restantes DESC
""", (RICARDO_ID,))
print("\n  Planes de cuota activos (restantes):")
for row in cur.fetchall():
    nombre, actual, total, restantes, monto = row
    print(f"    - {nombre}: {actual}/{total} | Restantes: {restantes} | Monto/mes: {monto:,.0f}")

# Calculate projected monthly cuota burden for April
cur.execute("""
    SELECT SUM(monto_cuota)
    FROM cuota c JOIN gasto g ON c.gasto_id = g.id
    WHERE g.miembro_id = %s AND c.activa = true
""", (RICARDO_ID,))
total_cuotas_mes = cur.fetchone()[0] or 0
print(f"\n  CARGA MENSUAL EN CUOTAS (abril en adelante): {total_cuotas_mes:,.0f} Gs/mes")
print(f"  Saldo actual según Excel: 18,063,445 Gs")
print(f"  Sueldo mensual: 21,840,000 Gs")
print(f"  Excedente mensual proyectado (solo cuotas): {21_840_000 - total_cuotas_mes:,.0f} Gs")

conn.close()
print("\nConexión cerrada.")

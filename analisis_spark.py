"""
=============================================================
  ShellDB — Apache Spark Analytics Pipeline
=============================================================
  Uso:
      python3 analisis_spark.py

  Requisitos (instalar una vez):
      pip3 install pyspark pymongo python-dotenv

  Tambien necesitas el JAR del conector MongoDB-Spark:
      Ver README_SPARK.md para instrucciones completas.
=============================================================
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone
from dotenv import load_dotenv

# Argumentos CLI: permite pasar --db NOMBRE_BD
parser = argparse.ArgumentParser(description="ShellDB Spark Analytics Pipeline")
parser.add_argument("--db", type=str, default=None,
    help="Nombre de la base de datos a analizar (ej: tienda_jorge)")
args = parser.parse_args()

# ── Cargar variables de entorno desde .env.local ──────────────────────────────
load_dotenv(".env.local")
MONGODB_URI = os.getenv("MONGODB_URI", "")

if not MONGODB_URI:
    print("❌  ERROR: MONGODB_URI no encontrada en .env.local")
    sys.exit(1)

# ── Importar PySpark ──────────────────────────────────────────────────────────
try:
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    from pyspark.sql.window import Window
    from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType, TimestampType
except ImportError:
    print("❌  ERROR: PySpark no instalado. Ejecuta: pip3 install pyspark")
    sys.exit(1)

try:
    import pymongo
except ImportError:
    print("❌  ERROR: pymongo no instalado. Ejecuta: pip3 install pymongo")
    sys.exit(1)

# Rutas a los JARs requeridos
JARS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spark_jars")

REQUIRED_JARS = {
    "mongo-spark-connector_2.12-10.3.0.jar":  "https://repo1.maven.org/maven2/org/mongodb/spark/mongo-spark-connector_2.12/10.3.0/mongo-spark-connector_2.12-10.3.0.jar",
    "mongodb-driver-sync-4.11.1.jar":         "https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-sync/4.11.1/mongodb-driver-sync-4.11.1.jar",
    "mongodb-driver-core-4.11.1.jar":         "https://repo1.maven.org/maven2/org/mongodb/mongodb-driver-core/4.11.1/mongodb-driver-core-4.11.1.jar",
    "bson-4.11.1.jar":                        "https://repo1.maven.org/maven2/org/mongodb/bson/4.11.1/bson-4.11.1.jar",
    "bson-record-codec-4.11.1.jar":           "https://repo1.maven.org/maven2/org/mongodb/bson-record-codec/4.11.1/bson-record-codec-4.11.1.jar",
}

os.makedirs(JARS_DIR, exist_ok=True)

missing = [name for name in REQUIRED_JARS if not os.path.exists(os.path.join(JARS_DIR, name))]
if missing:
    print(f"ERROR: Faltan {len(missing)} JAR(s) en spark_jars/:")
    for name in missing:
        print(f"   - {name}")
    print("\n   Descargalos con:")
    print(f"   cd spark_jars")
    for name, url in REQUIRED_JARS.items():
        if name in missing:
            print(f"   wget {url}")
    sys.exit(1)

ALL_JARS = ",".join(os.path.join(JARS_DIR, name) for name in REQUIRED_JARS)

# =============================================================================
#  INICIALIZAR SPARK SESSION
# =============================================================================
print("\nIniciando Apache Spark...")

spark = (
    SparkSession.builder
    .appName("ShellDB-Analytics")
    .master("local[*]")
    .config("spark.jars", ALL_JARS)
    .config("spark.mongodb.read.connection.uri", MONGODB_URI)
    .config("spark.mongodb.write.connection.uri", MONGODB_URI)
    .config("spark.driver.memory", "1g")
    .config("spark.sql.shuffle.partitions", "4")
    .config("spark.ui.showConsoleProgress", "false")
    .getOrCreate()
)

spark.sparkContext.setLogLevel("ERROR")
print("✅  Spark iniciado correctamente\n")

# ── Extraer nombre de base de datos del URI ───────────────────────────────────
# El URI tiene formato: mongodb+srv://user:pass@host/DATABASE?...
import re
# Prioridad: 1) --db argumento CLI, 2) "tienda" por defecto
DB_NAME = args.db if args.db else "tienda"
print(f"📦  Base de datos: {DB_NAME}\n")

# =============================================================================
#  HELPER: Leer coleccion desde MongoDB con Spark
# =============================================================================
def leer_coleccion(coleccion: str):
    return (
        spark.read
        .format("mongodb")
        .option("database", DB_NAME)
        .option("collection", coleccion)
        .load()
    )

# =============================================================================
#  HELPER: Guardar resultado en MongoDB via pymongo
# =============================================================================
mongo_client = pymongo.MongoClient(MONGODB_URI)
mongo_db = mongo_client[DB_NAME]

def guardar_resultado(tipo: str, datos):
    """Guarda el resultado del analisis en la coleccion spark_results"""
    mongo_db["spark_results"].replace_one(
        {"tipo": tipo},
        {
            "tipo": tipo,
            "datos": datos,
            "procesado_en": datetime.now(timezone.utc).isoformat(),
            "version": "spark-3.x",
        },
        upsert=True,
    )
    print(f"  ✅  Guardado: {tipo}")

# =============================================================================
#  STEP 1 — LEER DATOS
# =============================================================================
print("=" * 55)
print("  STEP 1 — Ingesta de datos desde MongoDB")
print("=" * 55)

df_ventas       = leer_coleccion("ventas")
df_detalle      = leer_coleccion("detalle_ventas")
df_sucursales   = leer_coleccion("sucursales")
df_productos    = leer_coleccion("productos")
df_empleados    = leer_coleccion("empleados")

# Contar registros
n_ventas    = df_ventas.count()
n_detalle   = df_detalle.count()
n_suc       = df_sucursales.count()
n_prod      = df_productos.count()
n_emp       = df_empleados.count()

total_registros = n_ventas + n_detalle + n_suc + n_prod + n_emp

print(f"  ventas:          {n_ventas:>6,} registros")
print(f"  detalle_ventas:  {n_detalle:>6,} registros")
print(f"  sucursales:      {n_suc:>6,} registros")
print(f"  productos:       {n_prod:>6,} registros")
print(f"  empleados:       {n_emp:>6,} registros")
print(f"  {'─'*35}")
print(f"  TOTAL:           {total_registros:>6,} registros\n")

# =============================================================================
#  STEP 2 — TRANSFORMACIONES
# =============================================================================
print("=" * 55)
print("  STEP 2 — Transformaciones")
print("=" * 55)

# Limpiar y castear columnas de ventas
df_ventas_clean = (
    df_ventas
    .select(
        F.col("sucursal_codigo").cast(StringType()),
        F.col("total").cast(DoubleType()),
        F.col("items_count").cast(LongType()),
        F.col("empleado_codigo").cast(StringType()),
        F.col("empleado_nombre").cast(StringType()),
        F.col("fecha").cast(TimestampType()),
    )
    .filter(F.col("total").isNotNull())
    .filter(F.col("sucursal_codigo").isNotNull())
)

# Agregar columnas derivadas de tiempo
df_ventas_tiempo = (
    df_ventas_clean
    .withColumn("anio",  F.year("fecha"))
    .withColumn("mes",   F.month("fecha"))
    .withColumn("dia",   F.dayofmonth("fecha"))
    .withColumn("hora",  F.hour("fecha"))
    .withColumn("mes_str", F.date_format("fecha", "yyyy-MM"))
)

# Limpiar detalle de ventas
df_detalle_clean = (
    df_detalle
    .select(
        F.col("producto_codigo").cast(StringType()),
        F.col("producto_nombre").cast(StringType()),
        F.col("cantidad").cast(LongType()),
        F.col("precio_unitario").cast(DoubleType()),
        F.col("subtotal").cast(DoubleType()),
    )
    .filter(F.col("subtotal").isNotNull())
)

print("  Columnas derivadas de tiempo aplicadas")
print("  Tipos de datos normalizados\n")

# =============================================================================
#  STEP 3 — AGREGACIONES (GroupBy, Window, JOIN)
# =============================================================================
print("=" * 55)
print("  STEP 3 — Agregaciones con Spark SQL")
print("=" * 55)

# ------------------------------------------------------------------
#  3A. KPIs GLOBALES
# ------------------------------------------------------------------
print("\n  [3A] KPIs globales...")
kpis_row = df_ventas_clean.agg(
    F.round(F.sum("total"), 2).alias("totalIngresos"),
    F.count("*").alias("totalTransacciones"),
    F.round(F.avg("total"), 2).alias("promedioVenta"),
    F.round(F.max("total"), 2).alias("maxVenta"),
    F.round(F.min("total"), 2).alias("minVenta"),
    F.round(F.stddev("total"), 2).alias("desviacionEstandar"),
).first()

kpis_prod_row = df_detalle_clean.agg(
    F.sum("cantidad").alias("totalItems"),
).first()

kpis = {
    "totalIngresos":       float(kpis_row["totalIngresos"] or 0),
    "totalTransacciones":  int(kpis_row["totalTransacciones"] or 0),
    "promedioVenta":       float(kpis_row["promedioVenta"] or 0),
    "maxVenta":            float(kpis_row["maxVenta"] or 0),
    "minVenta":            float(kpis_row["minVenta"] or 0),
    "desviacionEstandar":  float(kpis_row["desviacionEstandar"] or 0),
    "totalItems":          int(kpis_prod_row["totalItems"] or 0) if kpis_prod_row else 0,
    "totalProductos":      n_prod,
    "totalSucursales":     n_suc,
    "totalEmpleados":      n_emp,
    "totalRegistrosProcesados": total_registros,
}
guardar_resultado("kpis", kpis)

# ------------------------------------------------------------------
#  3B. VENTAS POR SUCURSAL — GroupBy + Aggregation
# ------------------------------------------------------------------
print("  [3B] Ventas por sucursal...")

df_suc_nombres = df_sucursales.select(
    F.col("codigo").cast(StringType()).alias("codigo"),
    F.col("nombre").cast(StringType()).alias("nombre"),
)

df_ventas_suc = (
    df_ventas_clean
    .groupBy("sucursal_codigo")
    .agg(
        F.round(F.sum("total"), 2).alias("totalMonto"),
        F.count("*").alias("totalTransacciones"),
        F.round(F.avg("total"), 2).alias("promedio"),
        F.round(F.max("total"), 2).alias("maxVenta"),
        F.round(F.min("total"), 2).alias("minVenta"),
    )
    .join(df_suc_nombres, df_ventas_clean["sucursal_codigo"] == df_suc_nombres["codigo"], "left")
    .drop("codigo")
    .withColumnRenamed("sucursal_codigo", "codigo")
)

# Window function: rank por monto
window_rank = Window.orderBy(F.desc("totalMonto"))
df_ventas_suc = df_ventas_suc.withColumn("ranking", F.rank().over(window_rank))

ventas_por_sucursal = [
    {
        "sucursal":          r["nombre"] or r["codigo"],
        "codigo":            r["codigo"],
        "totalMonto":        float(r["totalMonto"] or 0),
        "totalTransacciones": int(r["totalTransacciones"] or 0),
        "promedio":          float(r["promedio"] or 0),
        "maxVenta":          float(r["maxVenta"] or 0),
        "minVenta":          float(r["minVenta"] or 0),
        "ranking":           int(r["ranking"]),
    }
    for r in df_ventas_suc.orderBy("ranking").collect()
]
guardar_resultado("ventas_por_sucursal", ventas_por_sucursal)

# ------------------------------------------------------------------
#  3C. SERIES MENSUALES — Window + Pivot
# ------------------------------------------------------------------
print("  [3C] Series mensuales...")

df_mensual_base = (
    df_ventas_tiempo
    .groupBy("mes_str", "sucursal_codigo")
    .agg(F.round(F.sum("total"), 2).alias("monto"))
    .orderBy("mes_str")
)

# Pivot: sucursales como columnas
sucursal_codigos = [r["codigo"] for r in df_suc_nombres.collect()]
df_pivot = (
    df_mensual_base
    .groupBy("mes_str")
    .pivot("sucursal_codigo", sucursal_codigos)
    .agg(F.round(F.sum("monto"), 2))
    .orderBy("mes_str")
)

# Mapear codigos a nombres
codigo_a_nombre = {r["codigo"]: r["nombre"] for r in df_suc_nombres.collect()}

series_mensuales = []
for r in df_pivot.tail(12):
    row_dict = {"mes": r["mes_str"]}
    for cod in sucursal_codigos:
        nombre = codigo_a_nombre.get(cod, cod)
        row_dict[nombre] = float(r[cod] or 0) if cod in r.asDict() else 0.0
    series_mensuales.append(row_dict)

sucursales_nombres = list(codigo_a_nombre.values())
guardar_resultado("series_mensuales", series_mensuales)
guardar_resultado("sucursales_nombres", sucursales_nombres)

# ------------------------------------------------------------------
#  3D. TOP PRODUCTOS — JOIN detalle + orden
# ------------------------------------------------------------------
print("  [3D] Top productos...")

df_top_prod = (
    df_detalle_clean
    .groupBy("producto_codigo", "producto_nombre")
    .agg(
        F.sum("cantidad").cast(LongType()).alias("cantidadVendida"),
        F.round(F.sum("subtotal"), 2).alias("montoTotal"),
        F.round(F.avg("precio_unitario"), 2).alias("precioPromedio"),
        F.count("*").alias("numTransacciones"),
    )
    .orderBy(F.desc("montoTotal"))
    .limit(10)
)

top_productos = [
    {
        "codigo":           r["producto_codigo"],
        "nombre":           r["producto_nombre"],
        "cantidadVendida":  int(r["cantidadVendida"] or 0),
        "montoTotal":       float(r["montoTotal"] or 0),
        "precioPromedio":   float(r["precioPromedio"] or 0),
        "numTransacciones": int(r["numTransacciones"] or 0),
    }
    for r in df_top_prod.collect()
]
guardar_resultado("top_productos", top_productos)

# ------------------------------------------------------------------
#  3E. VENTAS POR HORA — Time Analysis
# ------------------------------------------------------------------
print("  [3E] Análisis temporal por hora...")

df_hora = (
    df_ventas_tiempo
    .groupBy("hora")
    .agg(
        F.round(F.sum("total"), 2).alias("totalMonto"),
        F.count("*").alias("transacciones"),
        F.round(F.avg("total"), 2).alias("promedioMonto"),
    )
    .orderBy("hora")
)

series_hora = [
    {
        "hora":          f"{int(r['hora']):02d}:00",
        "total":         float(r["totalMonto"] or 0),
        "transacciones": int(r["transacciones"] or 0),
        "promedio":      float(r["promedioMonto"] or 0),
    }
    for r in df_hora.collect()
]
guardar_resultado("series_hora", series_hora)

# ------------------------------------------------------------------
#  3F. VENTAS POR DIA DE SEMANA
# ------------------------------------------------------------------
print("  [3F] Ventas por día de semana...")

dias_map = {1: "Dom", 2: "Lun", 3: "Mar", 4: "Mié", 5: "Jue", 6: "Vie", 7: "Sáb"}

df_semana = (
    df_ventas_tiempo
    .withColumn("dia_semana_num", F.dayofweek("fecha"))
    .groupBy("dia_semana_num")
    .agg(
        F.round(F.sum("total"), 2).alias("totalMonto"),
        F.count("*").alias("transacciones"),
    )
    .orderBy("dia_semana_num")
)

series_semana = [
    {
        "dia":           dias_map.get(r["dia_semana_num"], str(r["dia_semana_num"])),
        "total":         float(r["totalMonto"] or 0),
        "transacciones": int(r["transacciones"] or 0),
    }
    for r in df_semana.collect()
]
guardar_resultado("series_semana", series_semana)

# ------------------------------------------------------------------
#  3G. STOCK POR SUCURSAL
# ------------------------------------------------------------------
print("  [3G] Stock por sucursal...")

stock_por_sucursal = []
for suc in df_suc_nombres.collect():
    cod  = suc["codigo"]
    nombre = suc["nombre"]
    stock_total = 0
    bajo_stock  = 0
    sin_stock   = 0
    normal      = 0

    for prod in mongo_db["productos"].find({"activo": True}):
        stock = (prod.get("stock_por_sucursal") or {}).get(cod, 0)
        minimo = prod.get("stock_minimo", 10)
        stock_total += stock
        if stock == 0:
            sin_stock += 1
        elif stock <= minimo:
            bajo_stock += 1
        else:
            normal += 1

    stock_por_sucursal.append({
        "sucursal":   nombre,
        "codigo":     cod,
        "stockTotal": stock_total,
        "normal":     normal,
        "bajoStock":  bajo_stock,
        "sinStock":   sin_stock,
    })

guardar_resultado("stock_por_sucursal", stock_por_sucursal)

# ------------------------------------------------------------------
#  3H. TOP EMPLEADOS VENDEDORES
# ------------------------------------------------------------------
print("  [3H] Top empleados...")

df_emp_ventas = (
    df_ventas_clean
    .filter(F.col("empleado_codigo").isNotNull())
    .groupBy("empleado_codigo", "empleado_nombre")
    .agg(
        F.count("*").alias("numVentas"),
        F.round(F.sum("total"), 2).alias("montoTotal"),
        F.round(F.avg("total"), 2).alias("ticketPromedio"),
    )
    .orderBy(F.desc("montoTotal"))
    .limit(8)
)

top_empleados = [
    {
        "codigo":        r["empleado_codigo"],
        "nombre":        r["empleado_nombre"] or r["empleado_codigo"],
        "numVentas":     int(r["numVentas"] or 0),
        "montoTotal":    float(r["montoTotal"] or 0),
        "ticketPromedio": float(r["ticketPromedio"] or 0),
    }
    for r in df_emp_ventas.collect()
]
guardar_resultado("top_empleados", top_empleados)

# ------------------------------------------------------------------
#  3I. PERCENTILES DE VENTAS (estadística avanzada)
# ------------------------------------------------------------------
print("  [3I] Percentiles de ventas...")

percentiles = df_ventas_clean.stat.approxQuantile("total", [0.25, 0.50, 0.75, 0.90, 0.95], 0.01)
guardar_resultado("percentiles_ventas", {
    "p25": round(percentiles[0], 2) if percentiles else 0,
    "p50": round(percentiles[1], 2) if percentiles else 0,
    "p75": round(percentiles[2], 2) if percentiles else 0,
    "p90": round(percentiles[3], 2) if percentiles else 0,
    "p95": round(percentiles[4], 2) if percentiles else 0,
})

# =============================================================================
#  STEP 4 — GUARDAR METADATA DEL JOB
# =============================================================================
print("\n" + "=" * 55)
print("  STEP 4 — Guardando metadata del job")
print("=" * 55)

guardar_resultado("job_metadata", {
    "estado": "completado",
    "totalRegistrosProcesados": total_registros,
    "jobsEjecutados": 9,
    "sparkVersion": spark.version,
    "procesadoEn": datetime.now(timezone.utc).isoformat(),
})

# =============================================================================
#  FINALIZAR
# =============================================================================
spark.stop()
mongo_client.close()

print("\n" + "=" * 55)
print("  ✅  Pipeline completado exitosamente")
print(f"  📊  {total_registros:,} registros procesados")
print(f"  🗃️   9 análisis guardados en MongoDB → spark_results")
print(f"  🕒  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 55 + "\n")

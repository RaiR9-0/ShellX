"use client"

import useSWR from "swr"
import { useState } from "react"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  ReferenceLine,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = ["#DAA520", "#E74C3C", "#27AE60", "#3498DB", "#9B59B6", "#E67E22", "#1ABC9C", "#F39C12"]

const TT = {
  backgroundColor: "#1a1a2e",
  border: "1px solid #DAA520",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f0e6c8",
}

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: `linear-gradient(135deg, #1a1a2e 60%, ${color}18)`, border: `1px solid ${color}40` }}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10" style={{ background: color }} />
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
      </div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-[10px] text-white/40 font-mono">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, op, color }: { title: string; op: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-7 rounded-full" style={{ background: color }} />
      <h2 className="font-black text-white text-base">{title}</h2>
      <span className="ml-auto text-[10px] font-mono px-2 py-1 rounded-full border"
        style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{op}</span>
    </div>
  )
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 border border-white/10" style={{ background: "#12121f" }}>
      {children}
    </div>
  )
}

function LoadingScreen() {
  const steps = ["Leyendo MongoDB", "Transformando datos", "Ejecutando GroupBy", "Window Functions", "Guardando resultados"]
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)" }}>
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-2 border-yellow-500/20 border-t-yellow-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">⚡</div>
      </div>
      <div className="text-center">
        <p className="text-yellow-500 font-black text-2xl tracking-tight">Apache Spark</p>
        <p className="text-white/40 text-sm mt-1 font-mono">Cargando resultados del pipeline...</p>
      </div>
      <div className="flex flex-col gap-2 w-64">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border border-yellow-500/40 flex items-center justify-center text-[10px] text-yellow-500">{i + 1}</div>
            <div className="flex-1 h-1 rounded-full bg-white/5">
              <div className="h-full rounded-full bg-yellow-500/60" style={{ width: `${(i + 1) * 20}%` }} />
            </div>
            <span className="text-white/30 text-[10px] font-mono w-32 truncate">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoDataScreen({ dbName }: { dbName?: string }) {
  const db = dbName || "tienda"
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)" }}>
      <div className="text-6xl">🔥</div>
      <div className="text-center max-w-lg">
        <p className="text-yellow-500 font-black text-2xl mb-2">Sin resultados de Spark</p>
        <p className="text-white/50 text-sm mb-2">El pipeline de Apache Spark aún no ha sido ejecutado para esta base de datos.</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-1"
          style={{ background: "rgba(218,165,32,0.1)", border: "1px solid rgba(218,165,32,0.3)" }}>
          <span className="text-[10px] font-mono text-yellow-400/60">BD activa:</span>
          <span className="text-yellow-400 font-bold font-mono text-sm">{db}</span>
        </div>
      </div>
      <div className="w-full max-w-lg rounded-2xl border border-yellow-500/30 p-5" style={{ background: "#12121f" }}>
        <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-3">Cómo ejecutar el pipeline</p>
        <div className="space-y-1">
          {[
            "# Correr el script para tu base de datos:",
            `python3 analisis_spark.py --db ${db}`,
            "",
            "# O si es la primera vez, instalar dependencias:",
            "pip3 install pyspark==3.5.4 pymongo python-dotenv --break-system-packages",
          ].map((line, i) => (
            <p key={i} className={`font-mono text-xs ${line.startsWith("#") ? "text-green-400" : line === "" ? "h-2 block" : "text-yellow-300/80 bg-white/5 rounded px-2 py-1 mt-1"}`}>{line}</p>
          ))}
        </div>
      </div>
      <p className="text-white/20 text-xs font-mono">Ver README_SPARK.md para más detalles</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useSWR("/api/spark-results", fetcher, { revalidateOnFocus: false })
  const [tab, setTab] = useState<"overview" | "sucursales" | "productos" | "tiempo" | "empleados">("overview")

  if (isLoading) return <LoadingScreen />
  if (error || !data || data.error) return <NoDataScreen dbName={data?._meta?.userDbName} />

  const {
    kpis = {} as Record<string, number>,
    ventas_por_sucursal: ventasSuc = [],
    series_mensuales: seriesMes = [],
    top_productos: topProd = [],
    series_hora: seriesHora = [],
    series_semana: seriesSemana = [],
    stock_por_sucursal: stockSuc = [],
    top_empleados: topEmp = [],
    percentiles_ventas: percentiles = {} as Record<string, number>,
    sucursales_nombres: sucNombres = [],
    _meta: meta = {} as Record<string, unknown>,
  } = data

  const tabs = [
    { id: "overview",   label: "Overview",   emoji: "📊" },
    { id: "sucursales", label: "Sucursales", emoji: "🏪" },
    { id: "productos",  label: "Productos",  emoji: "📦" },
    { id: "tiempo",     label: "Tiempo",     emoji: "🕐" },
    { id: "empleados",  label: "Empleados",  emoji: "👥" },
  ]

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #0d0d1a 100%)" }}>

      {/* Header */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1a2e, #2d1f00)", border: "1px solid rgba(218,165,32,0.4)" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5 pointer-events-none"
            style={{ width: `${60 + i * 50}px`, height: `${60 + i * 50}px`, background: "#DAA520", top: "50%", right: `${-30 + i * 15}px`, transform: "translateY(-50%)" }} />
        ))}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(218,165,32,0.15)", border: "1px solid rgba(218,165,32,0.3)" }}>⚡</div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Apache Spark Analytics</h1>
                <p className="text-white/40 text-xs font-mono">Distributed Data Processing Pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap mt-3">
              {["Ingesta", "Transform", "GroupBy", "Window Fn", "JOIN", "Percentiles", "Visualizar"].map((s, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(218,165,32,0.15)", color: "#DAA520", border: "1px solid rgba(218,165,32,0.3)" }}>{s}</span>
                  {i < arr.length - 1 && <span className="text-white/20 text-xs">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(39,174,96,0.15)", border: "1px solid rgba(39,174,96,0.3)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">
                {(kpis.totalRegistrosProcesados || 0).toLocaleString()} registros procesados
              </span>
            </div>
            {meta.procesadoEn && (
              <span className="text-white/25 text-[10px] font-mono">
                Último job: {new Date(meta.procesadoEn as string).toLocaleString("es-MX")}
              </span>
            )}
            <div className="flex flex-col items-end gap-1">
              <div className="px-3 py-1 rounded-full text-[10px] font-mono"
                style={{ background: "rgba(218,165,32,0.1)", color: "#DAA520", border: "1px solid rgba(218,165,32,0.2)" }}>
                spark-3.x · local[*]
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <span className="text-blue-400/60 text-[10px] font-mono">BD:</span>
                <span className="text-blue-300 font-bold font-mono text-xs">{meta.userDbName || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Ingresos Totales" value={`$${(kpis.totalIngresos || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} sub="SUM(total)" color="#DAA520" icon="💰" />
        <KpiCard label="Transacciones" value={(kpis.totalTransacciones || 0).toLocaleString()} sub="COUNT(*)" color="#3498DB" icon="🧾" />
        <KpiCard label="Ticket Promedio" value={`$${(kpis.promedioVenta || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} sub="AVG(total)" color="#27AE60" icon="📈" />
        <KpiCard label="Items Vendidos" value={(kpis.totalItems || 0).toLocaleString()} sub="SUM(cantidad)" color="#9B59B6" icon="📦" />
        <KpiCard label="Desv. Estándar" value={`$${(kpis.desviacionEstandar || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} sub="STDDEV(total)" color="#E74C3C" icon="📉" />
      </div>

      {/* Percentiles */}
      {percentiles.p25 !== undefined && (
        <div className="rounded-2xl p-4 border border-white/10" style={{ background: "#12121f" }}>
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3">Distribución de ventas · approxQuantile()</p>
          <div className="flex items-end gap-3">
            {[
              { label: "P25", value: percentiles.p25, color: "#3498DB" },
              { label: "P50 (mediana)", value: percentiles.p50, color: "#DAA520" },
              { label: "P75", value: percentiles.p75, color: "#27AE60" },
              { label: "P90", value: percentiles.p90, color: "#E67E22" },
              { label: "P95", value: percentiles.p95, color: "#E74C3C" },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-1 flex-1">
                <p className="text-white text-xs font-bold">${(p.value || 0).toLocaleString("es-MX")}</p>
                <div className="w-full rounded-full h-2" style={{ background: `${p.color}20` }}>
                  <div className="h-2 rounded-full" style={{ background: p.color, width: "100%" }} />
                </div>
                <p className="text-white/30 text-[9px] font-mono">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: "#12121f", border: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex-1 justify-center"
            style={tab === t.id
              ? { background: "linear-gradient(135deg, #DAA520, #B8860B)", color: "#fff" }
              : { color: "rgba(255,255,255,0.35)" }}>
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard>
            <SectionHeader title="Monto Total por Sucursal" op="GroupBy + SUM" color="#DAA520" />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ventasSuc} margin={{ top: 5, right: 10, left: 10, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sucursal" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Total"]} />
                <Bar dataKey="totalMonto" radius={[6, 6, 0, 0]}>
                  {ventasSuc.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard>
            <SectionHeader title="Participación en Transacciones" op="COUNT(*) GROUP BY" color="#3498DB" />
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={230}>
                <PieChart>
                  <Pie data={ventasSuc} dataKey="totalTransacciones" nameKey="sucursal" cx="50%" cy="50%" outerRadius={95} innerRadius={45}>
                    {ventasSuc.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {ventasSuc.map((s: { sucursal: string; totalTransacciones: number; ranking: number }, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-white/60 truncate flex-1">{s.sucursal}</span>
                    <span className="font-bold text-white">{s.totalTransacciones}</span>
                    <span className="text-[10px] font-mono text-white/30">#{s.ranking}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard>
            <SectionHeader title="Ticket Promedio por Sucursal" op="AVG(total) GROUP BY" color="#27AE60" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasSuc} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${v.toLocaleString("es-MX")}`} />
                <YAxis type="category" dataKey="sucursal" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} width={95} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Promedio"]} />
                <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
                  {ventasSuc.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard>
            <SectionHeader title="Ventas por Día de Semana" op="DAYOFWEEK + SUM" color="#E67E22" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={seriesSemana} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Total"]} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {seriesSemana.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── SUCURSALES ── */}
      {tab === "sucursales" && (
        <div className="space-y-5">
          <ChartCard>
            <SectionHeader title="Evolución Mensual por Sucursal" op="PIVOT + Window Function" color="#3498DB" />
            {seriesMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seriesMes} margin={{ top: 5, right: 20, left: 20, bottom: 40 }}>
                  <defs>
                    {(sucNombres as string[]).map((n: string, i: number) => (
                      <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v: number) => `$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }} />
                  {(sucNombres as string[]).map((n: string, i: number) => (
                    <Area key={n} type="monotone" dataKey={n} stroke={COLORS[i % COLORS.length]} fill={`url(#g${i})`} strokeWidth={2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm font-mono">Sin datos mensuales aún</div>
            )}
          </ChartCard>

          <ChartCard>
            <SectionHeader title="Estado del Inventario por Sucursal" op="CASE WHEN stock = 0 ..." color="#E74C3C" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockSuc} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sucursal" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }} />
                <Bar dataKey="normal" name="Normal" fill="#27AE60" stackId="a" />
                <Bar dataKey="bajoStock" name="Bajo Stock" fill="#F39C12" stackId="a" />
                <Bar dataKey="sinStock" name="Sin Stock" fill="#E74C3C" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {ventasSuc.length > 0 && (
            <ChartCard>
              <SectionHeader title="Radar Comparativo de Desempeño" op="NORMALIZE + RANK" color="#9B59B6" />
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={(() => {
                  const mM = Math.max(...ventasSuc.map((s: { totalMonto: number }) => s.totalMonto), 1)
                  const mT = Math.max(...ventasSuc.map((s: { totalTransacciones: number }) => s.totalTransacciones), 1)
                  const mP = Math.max(...ventasSuc.map((s: { promedio: number }) => s.promedio), 1)
                  const mS = Math.max(...stockSuc.map((s: { stockTotal: number }) => s.stockTotal), 1)
                  return ventasSuc.map((s: { sucursal: string; totalMonto: number; totalTransacciones: number; promedio: number }) => {
                    const st = stockSuc.find((x: { sucursal: string; stockTotal: number }) => x.sucursal === s.sucursal) ?? { stockTotal: 0 }
                    return {
                      suc: s.sucursal.split(" ")[0],
                      Ingresos: Math.round((s.totalMonto / mM) * 100),
                      Transacciones: Math.round((s.totalTransacciones / mT) * 100),
                      TicketProm: Math.round((s.promedio / mP) * 100),
                      Inventario: Math.round((st.stockTotal / mS) * 100),
                    }
                  })
                })()}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="suc" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "rgba(255,255,255,0.2)" }} />
                  {["Ingresos", "Transacciones", "TicketProm", "Inventario"].map((k, i) => (
                    <Radar key={k} name={k} dataKey={k} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                  ))}
                  <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── PRODUCTOS ── */}
      {tab === "productos" && (
        <div className="space-y-5">
          <ChartCard>
            <SectionHeader title="Top 10 Productos por Monto Vendido" op="JOIN + ORDER BY DESC LIMIT 10" color="#E67E22" />
            {topProd.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProd} layout="vertical" margin={{ top: 0, right: 30, left: 130, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} width={125} />
                  <Tooltip contentStyle={TT} formatter={(v: number, n: string) => n === "montoTotal" ? [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Monto"] : [v, "Cantidad"]} />
                  <Bar dataKey="montoTotal" radius={[0, 6, 6, 0]}>
                    {topProd.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm font-mono">Sin detalle de ventas disponible</div>
            )}
          </ChartCard>

          {topProd.length > 0 && (
            <ChartCard>
              <SectionHeader title="Dispersión: Cantidad vs Monto" op="Scatter Analysis" color="#9B59B6" />
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="cantidadVendida" name="Cantidad" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }} label={{ value: "Cantidad vendida", position: "insideBottom", offset: -12, style: { fontSize: 10, fill: "rgba(255,255,255,0.3)" } }} />
                  <YAxis dataKey="montoTotal" name="Monto" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ZAxis range={[50, 250]} />
                  <Tooltip contentStyle={TT} content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0]?.payload
                      return (
                        <div style={TT} className="p-2 text-xs">
                          <p className="font-bold text-yellow-400 mb-1">{d?.nombre}</p>
                          <p className="text-white/70">Cantidad: <span className="text-white font-bold">{d?.cantidadVendida}</span></p>
                          <p className="text-white/70">Monto: <span className="text-white font-bold">${d?.montoTotal?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></p>
                        </div>
                      )
                    }
                    return null
                  }} />
                  <Scatter data={topProd} fill="#DAA520">
                    {topProd.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── TIEMPO ── */}
      {tab === "tiempo" && (
        <div className="space-y-5">
          <ChartCard>
            <SectionHeader title="Monto de Ventas por Hora del Día" op="EXTRACT(HOUR) + SUM" color="#1ABC9C" />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={seriesHora} margin={{ top: 5, right: 20, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="horaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1ABC9C" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#1ABC9C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Total"]} />
                <ReferenceLine x="12:00" stroke="#DAA520" strokeDasharray="4 4" label={{ value: "Mediodía", fill: "#DAA520", fontSize: 10 }} />
                <Area type="monotone" dataKey="total" stroke="#1ABC9C" fill="url(#horaGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard>
              <SectionHeader title="Transacciones por Hora" op="COUNT(*) GROUP BY HOUR" color="#3498DB" />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={seriesHora} margin={{ top: 5, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)" }} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip contentStyle={TT} />
                  <Line type="monotone" dataKey="transacciones" stroke="#3498DB" strokeWidth={2.5} dot={{ fill: "#3498DB", r: 3 }} name="Transacciones" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard>
              <SectionHeader title="Ventas por Día de Semana" op="DAYOFWEEK + SUM" color="#E67E22" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={seriesSemana} margin={{ top: 5, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Total"]} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {seriesSemana.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── EMPLEADOS ── */}
      {tab === "empleados" && (
        <div className="space-y-5">
          <ChartCard>
            <SectionHeader title="Top Vendedores por Monto Total" op="JOIN empleados ORDER BY monto DESC" color="#E67E22" />
            {topEmp.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topEmp} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TT} formatter={(v: number, n: string) => n === "montoTotal" ? [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Monto"] : [v, n]} />
                  <Bar dataKey="montoTotal" radius={[6, 6, 0, 0]}>
                    {topEmp.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm font-mono">Sin datos de empleados vendedores</div>
            )}
          </ChartCard>

          {topEmp.length > 0 && (
            <ChartCard>
              <SectionHeader title="# Ventas vs Ticket Promedio" op="Multi-metric comparison" color="#3498DB" />
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topEmp} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `$${v.toLocaleString("es-MX")}`} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }} />
                  <Bar yAxisId="left" dataKey="numVentas" name="# Ventas" fill="#3498DB" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="ticketPromedio" name="Ticket Prom ($)" fill="#DAA520" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-white/5"
        style={{ background: "#0a0a14" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-white text-sm font-black">Apache Spark · ShellDB Pipeline</p>
            <p className="text-white/25 text-[10px] font-mono">Procesamiento offline → resultados en colección spark_results</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["GroupBy", "Window Fn", "JOIN", "Pivot", "approxQuantile", "STDDEV", "RANK"].map((op) => (
            <span key={op} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(218,165,32,0.08)", color: "rgba(218,165,32,0.6)", border: "1px solid rgba(218,165,32,0.15)" }}>{op}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

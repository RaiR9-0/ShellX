"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

// ─── Colores pastel naranja coherentes con ShellDB ───────────────────────────
const C = {
  gold:    "#B8860B",
  amber:   "#DAA520",
  light:   "#FCF3CF",
  cream:   "#FFF8DC",
  bg:      "#E9D173",
  dark:    "#2C3E50",
  gray:    "#6B7280",
  red:     "#E74C3C",
  green:   "#27AE60",
  blue:    "#3498DB",
  orange:  "#E67E22",
  purple:  "#9B59B6",
}
const PALETTE = [C.gold, C.orange, C.blue, C.green, C.purple, C.red, "#1ABC9C", "#F39C12"]

const TT = {
  backgroundColor: "#FFF8DC",
  border: "1px solid #D4A017",
  borderRadius: "8px",
  fontSize: "12px",
  color: C.dark,
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm" style={{ background: C.light, border: `1px solid ${color}40` }}>
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color: C.dark }}>{value}</p>
      {sub && <p className="text-[10px] font-mono" style={{ color: C.gray }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-6 rounded-full" style={{ background: color }} />
      <h3 className="font-black text-sm" style={{ color: C.dark }}>{title}</h3>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-5 shadow-sm ${className}`} style={{ background: C.light, border: "1px solid #D4A01740" }}>{children}</div>
}

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface UserRow {
  _id: string
  username: string
  email: string
  phone: string
  database_name: string
  createdAt: string | null
  stats: { productos: number; ventas: number; compras: number; empleados: number; sucursales: number; ultima_venta: string | null }
}

interface SecurityData {
  superadmin: {
    totalFallidos: number; totalExitosos: number
    topIps: { ip: string; count: number }[]
    serieDiaria: { dia: string; intentos: number }[]
    serieHora: { hora: string; intentos: number }[]
    ultimos: { ip: string; user_agent: string; fecha: string; motivo: string; username: string }[]
  }
  usuarios: {
    totalFallidos: number; totalExitosos: number
    topIps: { ip: string; count: number }[]
    topUsersConFallos: { usuario: string; intentos: number }[]
    serieDiaria: { dia: string; fallidos: number; exitosos: number }[]
  }
  recientes: { origen: string; tipo: string; username: string; ip: string; user_agent: string; fecha: string; motivo: string }[]
}

// ═══════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Credenciales incorrectas"); return }
      onLogin()
    } catch { setError("Error de conexion") } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl shadow-xl p-8 flex flex-col gap-5" style={{ background: C.light, border: "1px solid #D4A017" }}>
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: C.gold }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-black" style={{ color: C.dark }}>Administrador Total</h1>
            <p className="text-sm mt-1" style={{ color: C.gray }}>ShellDB · Panel de Control Global</p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#E74C3C15", border: "1px solid #E74C3C40", color: C.red }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold" style={{ color: C.dark }}>Usuario</label>
              <input
                type="text" value={user} onChange={(e) => setUser(e.target.value)} required autoFocus
                placeholder="admin"
                className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "white", border: "1.5px solid #D4A017", color: C.dark }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold" style={{ color: C.dark }}>Contrasena</label>
              <input
                type="password" value={pass} onChange={(e) => setPass(e.target.value)} required
                placeholder="••••••"
                className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: "white", border: "1.5px solid #D4A017", color: C.dark }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-black text-white text-sm cursor-pointer transition-all"
              style={{ background: loading ? "#D4A017" : C.gold, opacity: loading ? 0.8 : 1 }}
            >
              {loading ? "Verificando..." : "Acceder al Panel"}
            </button>
          </form>

          <a href="/" className="text-center text-xs cursor-pointer" style={{ color: C.gray }}>
            ← Volver al inicio de sesion
          </a>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#9B7D3A" }}>
          Acceso restringido · Las credenciales se configuran en variables de entorno
        </p>
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
function Dashboard() {
  const [tab, setTab] = useState<"usuarios" | "seguridad">("usuarios")
  const [users, setUsers] = useState<UserRow[]>([])
  const [security, setSecurity] = useState<SecurityData | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingSec, setLoadingSec] = useState(true)
  const [search, setSearch] = useState("")

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const r = await fetch("/api/superadmin/users")
      if (r.ok) setUsers(await r.json())
    } finally { setLoadingUsers(false) }
  }, [])

  const loadSecurity = useCallback(async () => {
    setLoadingSec(true)
    try {
      const r = await fetch("/api/superadmin/security")
      if (r.ok) setSecurity(await r.json())
    } finally { setLoadingSec(false) }
  }, [])

  useEffect(() => { loadUsers(); loadSecurity() }, [loadUsers, loadSecurity])

  async function handleLogout() {
    await fetch("/api/superadmin/logout", { method: "POST" })
    window.location.reload()
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.database_name.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { id: "usuarios", label: "Usuarios & Tiendas", icon: "🏪" },
    { id: "seguridad", label: "Analytics de Seguridad", icon: "🔐" },
  ]

  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      {/* Topbar */}
      <header className="px-6 py-4 flex items-center justify-between shadow-sm" style={{ background: C.gold }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-black text-base leading-none">Administrador Total</h1>
            <p className="text-white/70 text-[11px]">ShellDB · Panel Global</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-white cursor-pointer transition-all"
          style={{ background: "rgba(231,76,60,0.9)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* KPIs globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Tiendas Activas" value={users.length} sub="usuarios registrados" color={C.gold} icon="🏪" />
          <KpiCard label="Intentos Fallidos SA" value={security?.superadmin.totalFallidos ?? "—"} sub="login superadmin" color={C.red} icon="🚨" />
          <KpiCard label="Intentos Fallidos Usuarios" value={security?.usuarios.totalFallidos ?? "—"} sub="login usuarios" color={C.orange} icon="⚠️" />
          <KpiCard label="IPs Sospechosas" value={security ? Math.max(security.superadmin.topIps.length, security.usuarios.topIps.length) : "—"} sub="con intentos fallidos" color={C.purple} icon="🌐" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.light, border: "1px solid #D4A01730" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold flex-1 justify-center transition-all cursor-pointer"
              style={tab === t.id
                ? { background: C.gold, color: "white" }
                : { color: C.gray }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB USUARIOS ── */}
        {tab === "usuarios" && (
          <div className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={C.gray} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" placeholder="Buscar por usuario, email o tienda..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: C.light, border: "1.5px solid #D4A017", color: C.dark }}
              />
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
                  <p className="text-sm font-semibold" style={{ color: C.gray }}>Cargando usuarios...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredUsers.map((u, i) => (
                  <div key={u._id} className="rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md"
                    style={{ background: C.light, border: "1px solid #D4A01740" }}>
                    {/* Header usuario */}
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl font-black text-white text-base shrink-0"
                        style={{ background: PALETTE[i % PALETTE.length] }}>
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate" style={{ color: C.dark }}>{u.username}</p>
                        <p className="text-xs truncate" style={{ color: C.gray }}>{u.email || "Sin email"}</p>
                        {u.phone && <p className="text-xs" style={{ color: C.gray }}>{u.phone}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${PALETTE[i % PALETTE.length]}20`, color: PALETTE[i % PALETTE.length], border: `1px solid ${PALETTE[i % PALETTE.length]}30` }}>
                        #{i + 1}
                      </span>
                    </div>

                    {/* Tienda */}
                    <div className="rounded-xl px-3 py-2" style={{ background: C.cream, border: "1px solid #D4A01730" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.gold }}>Base de datos / Tienda</p>
                      <p className="text-sm font-black font-mono" style={{ color: C.dark }}>{u.database_name || "—"}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Ventas", value: u.stats.ventas, icon: "🧾" },
                        { label: "Compras", value: u.stats.compras, icon: "📦" },
                        { label: "Productos", value: u.stats.productos, icon: "🏷️" },
                        { label: "Empleados", value: u.stats.empleados, icon: "👤" },
                        { label: "Sucursales", value: u.stats.sucursales, icon: "🏪" },
                        { label: "Registrado", value: u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-MX", { month: "short", year: "2-digit" }) : "—", icon: "📅" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl px-2 py-2 text-center" style={{ background: "white", border: "1px solid #D4A01720" }}>
                          <p className="text-base leading-none mb-0.5">{s.icon}</p>
                          <p className="text-xs font-black" style={{ color: C.dark }}>{s.value}</p>
                          <p className="text-[9px] font-mono" style={{ color: C.gray }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Ultima venta */}
                    {u.stats.ultima_venta && (
                      <p className="text-[10px] font-mono text-right" style={{ color: C.gray }}>
                        Última venta: {new Date(u.stats.ultima_venta).toLocaleString("es-MX")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="text-center py-16" style={{ color: C.gray }}>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-bold">Sin resultados para "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB SEGURIDAD ── */}
        {tab === "seguridad" && (
          <div className="space-y-5">
            {loadingSec ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
                  <p className="text-sm font-semibold" style={{ color: C.gray }}>Analizando logs de seguridad...</p>
                </div>
              </div>
            ) : security ? (
              <>
                {/* ── SECCIÓN SUPERADMIN ── */}
                <div className="rounded-2xl px-5 py-4" style={{ background: "#E74C3C10", border: "1px solid #E74C3C30" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.red }}>🚨 Intentos al panel de Administrador Total</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard label="Fallidos SA" value={security.superadmin.totalFallidos} sub="intentos rechazados" color={C.red} icon="❌" />
                  <KpiCard label="Exitosos SA" value={security.superadmin.totalExitosos} sub="logins correctos" color={C.green} icon="✅" />
                  <KpiCard label="IPs únicas SA" value={security.superadmin.topIps.length} sub="con intentos fallidos" color={C.purple} icon="🌐" />
                  <KpiCard label="Tasa de fallo SA"
                    value={security.superadmin.totalFallidos + security.superadmin.totalExitosos > 0
                      ? `${Math.round(security.superadmin.totalFallidos / (security.superadmin.totalFallidos + security.superadmin.totalExitosos) * 100)}%`
                      : "0%"}
                    sub="del total de intentos" color={C.orange} icon="📊" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {security.superadmin.serieDiaria.length > 0 && (
                    <Card>
                      <SectionHeader title="Intentos fallidos SA por día" color={C.red} />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={security.superadmin.serieDiaria}>
                          <defs>
                            <linearGradient id="saGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.red} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="dia" tick={{ fontSize: 9, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Area type="monotone" dataKey="intentos" stroke={C.red} fill="url(#saGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {security.superadmin.serieHora.length > 0 && (
                    <Card>
                      <SectionHeader title="Distribución horaria SA" color={C.orange} />
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={security.superadmin.serieHora}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="hora" tick={{ fontSize: 8, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 8, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Bar dataKey="intentos" fill={C.orange} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {security.superadmin.topIps.length > 0 && (
                    <Card>
                      <SectionHeader title="Top IPs sospechosas · SA" color={C.purple} />
                      <div className="space-y-2">
                        {security.superadmin.topIps.map((ip, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: C.cream }}>
                            <span className="text-[10px] font-bold w-5 text-center rounded-full" style={{ background: PALETTE[i % PALETTE.length] + "25", color: PALETTE[i % PALETTE.length] }}>{i + 1}</span>
                            <code className="flex-1 text-xs font-mono font-bold" style={{ color: C.dark }}>{ip.ip}</code>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black" style={{ background: "#E74C3C15", color: C.red, border: "1px solid #E74C3C30" }}>{ip.count}x</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {security.superadmin.ultimos.length > 0 && (
                    <Card>
                      <SectionHeader title="Últimos intentos fallidos SA" color={C.red} />
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {security.superadmin.ultimos.map((a, i) => (
                          <div key={i} className="rounded-xl px-3 py-2.5 flex flex-col gap-1" style={{ background: C.cream, border: "1px solid #E74C3C15" }}>
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs font-bold font-mono" style={{ color: C.red }}>{a.ip}</code>
                              <span className="text-[10px] font-mono" style={{ color: C.gray }}>{new Date(a.fecha).toLocaleString("es-MX")}</span>
                            </div>
                            <p className="text-[11px]" style={{ color: C.gray }}>
                              Usuario: <span style={{ color: C.dark, fontWeight: 700 }}>{a.username}</span>
                              {" · "}{a.motivo?.replace(/_/g, " ")}
                            </p>
                            <p className="text-[10px] truncate font-mono" style={{ color: C.gray }}>{a.user_agent}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* ── SECCIÓN USUARIOS ── */}
                <div className="rounded-2xl px-5 py-4 mt-6" style={{ background: "#E67E2210", border: "1px solid #E67E2230" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.orange }}>⚠️ Intentos fallidos de usuarios normales</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard label="Fallidos usuarios" value={security.usuarios.totalFallidos} sub="logins rechazados" color={C.orange} icon="❌" />
                  <KpiCard label="Exitosos usuarios" value={security.usuarios.totalExitosos} sub="logins correctos" color={C.green} icon="✅" />
                  <KpiCard label="IPs sospechosas" value={security.usuarios.topIps.length} sub="usuarios fallidos" color={C.blue} icon="🌐" />
                  <KpiCard label="Usuarios con fallos" value={security.usuarios.topUsersConFallos.length} sub="cuentas con intentos" color={C.purple} icon="👤" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {security.usuarios.serieDiaria.length > 0 && (
                    <Card>
                      <SectionHeader title="Actividad de login diaria · Usuarios" color={C.blue} />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={security.usuarios.serieDiaria}>
                          <defs>
                            <linearGradient id="usFalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.orange} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="usOkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="dia" tick={{ fontSize: 9, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} />
                          <Area type="monotone" dataKey="exitosos" name="Exitosos" stroke={C.green} fill="url(#usOkGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="fallidos" name="Fallidos" stroke={C.orange} fill="url(#usFalGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {security.usuarios.topUsersConFallos.length > 0 && (
                    <Card>
                      <SectionHeader title="Usuarios con más intentos fallidos" color={C.orange} />
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={security.usuarios.topUsersConFallos} layout="vertical" margin={{ left: 80, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <YAxis type="category" dataKey="usuario" tick={{ fontSize: 10, fill: C.dark }} width={75} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Bar dataKey="intentos" radius={[0, 6, 6, 0]}>
                            {security.usuarios.topUsersConFallos.map((_: unknown, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {security.usuarios.topIps.length > 0 && (
                    <Card>
                      <SectionHeader title="Top IPs sospechosas · Usuarios" color={C.blue} />
                      <div className="space-y-2">
                        {security.usuarios.topIps.map((ip, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: C.cream }}>
                            <span className="text-[10px] font-bold w-5 text-center">{i + 1}</span>
                            <code className="flex-1 text-xs font-mono font-bold" style={{ color: C.dark }}>{ip.ip}</code>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black" style={{ background: "#E67E2215", color: C.orange, border: "1px solid #E67E2230" }}>{ip.count}x</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Pie chart fallidos vs exitosos */}
                  {(security.superadmin.totalFallidos + security.superadmin.totalExitosos + security.usuarios.totalFallidos + security.usuarios.totalExitosos) > 0 && (
                    <Card>
                      <SectionHeader title="Distribución global de intentos" color={C.gold} />
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "SA Fallidos", value: security.superadmin.totalFallidos },
                              { name: "SA Exitosos", value: security.superadmin.totalExitosos },
                              { name: "Users Fallidos", value: security.usuarios.totalFallidos },
                              { name: "Users Exitosos", value: security.usuarios.totalExitosos },
                            ].filter(d => d.value > 0)}
                            dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                            {[C.red, C.green, C.orange, "#27AE60"].map((c, i) => <Cell key={i} fill={c} />)}
                          </Pie>
                          <Tooltip contentStyle={TT} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  )}
                </div>

                {/* Tabla actividad reciente */}
                {security.recientes.length > 0 && (
                  <Card>
                    <SectionHeader title="Actividad reciente · Todos los intentos fallidos" color={C.gold} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ borderBottom: `1px solid #D4A01730` }}>
                            {["Origen", "Usuario", "IP", "Motivo", "User Agent", "Fecha"].map((h) => (
                              <th key={h} className="py-2 px-3 text-left font-black" style={{ color: C.gray, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {security.recientes.map((a, i) => (
                            <tr key={i} className="hover:bg-[#FFF8DC] transition-colors" style={{ borderBottom: `1px solid #D4A01715` }}>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={a.origen === "superadmin"
                                    ? { background: "#E74C3C15", color: C.red, border: "1px solid #E74C3C30" }
                                    : { background: "#E67E2215", color: C.orange, border: "1px solid #E67E2230" }}>
                                  {a.origen === "superadmin" ? "SA" : "User"}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-bold font-mono" style={{ color: C.dark }}>{a.username}</td>
                              <td className="py-2 px-3 font-mono" style={{ color: C.blue }}>{a.ip}</td>
                              <td className="py-2 px-3" style={{ color: C.gray }}>{(a.motivo || "").replace(/_/g, " ")}</td>
                              <td className="py-2 px-3 max-w-[150px] truncate font-mono" style={{ color: C.gray }}>{a.user_agent}</td>
                              <td className="py-2 px-3 font-mono whitespace-nowrap" style={{ color: C.gray }}>{new Date(a.fecha).toLocaleString("es-MX")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {security.superadmin.totalFallidos === 0 && security.usuarios.totalFallidos === 0 && (
                  <div className="text-center py-16 rounded-2xl" style={{ background: C.light, border: "1px solid #D4A01730" }}>
                    <p className="text-5xl mb-3">🛡️</p>
                    <p className="font-black text-lg" style={{ color: C.dark }}>Sin intentos fallidos registrados</p>
                    <p className="text-sm mt-1" style={{ color: C.gray }}>El sistema esta seguro · Los logs se generan automaticamente</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENTE RAIZ — verifica sesion SA
// ═══════════════════════════════════════════════════════════════════
export default function SuperAdminPage() {
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    // Verificar si ya hay sesion SA activa
    fetch("/api/superadmin/users")
      .then((r) => {
        setAuthed(r.ok)
        setChecked(true)
      })
      .catch(() => { setAuthed(false); setChecked(true) })
  }, [])

  if (!checked) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
      </main>
    )
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />
  return <Dashboard />
}

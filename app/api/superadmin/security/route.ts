import { withSaAuth } from "@/lib/sa-auth"
import { NextResponse } from "next/server"
import { getClient } from "@/lib/mongodb"

export const GET = withSaAuth(async ({ db }) => {
  // ── Intentos de login al superadmin ──────────────────────────────
  const saAttempts = await db
    .collection("sa_login_attempts")
    .find({})
    .sort({ fecha: -1 })
    .toArray()

  const saFallidos = saAttempts.filter((a) => a.tipo === "fallido")
  const saExitosos = saAttempts.filter((a) => a.tipo === "exitoso")

  // IPs más frecuentes en intentos fallidos SA
  const ipCountSa: Record<string, number> = {}
  for (const a of saFallidos) {
    const ip = a.ip || "desconocida"
    ipCountSa[ip] = (ipCountSa[ip] || 0) + 1
  }
  const topIpsSa = Object.entries(ipCountSa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  // Serie diaria intentos SA fallidos
  const byDaySa: Record<string, number> = {}
  for (const a of saFallidos) {
    const d = new Date(a.fecha).toISOString().split("T")[0]
    byDaySa[d] = (byDaySa[d] || 0) + 1
  }
  const serieDiariaSa = Object.entries(byDaySa)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dia, intentos]) => ({ dia, intentos }))

  // Serie por hora SA
  const byHourSa: Record<number, number> = {}
  for (const a of saFallidos) {
    const h = new Date(a.fecha).getHours()
    byHourSa[h] = (byHourSa[h] || 0) + 1
  }
  const serieHoraSa = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, "0")}:00`,
    intentos: byHourSa[h] || 0,
  })).filter((x) => x.intentos > 0)

  // ── Intentos de login de usuarios normales ───────────────────────
  // Leemos los login_attempts de la BD proyecto si existen
  const userAttempts = await db
    .collection("login_attempts")
    .find({})
    .sort({ fecha: -1 })
    .limit(500)
    .toArray()

  const userFallidos = userAttempts.filter((a) => a.tipo === "fallido")

  // IPs más frecuentes usuarios fallidos
  const ipCountUser: Record<string, number> = {}
  for (const a of userFallidos) {
    const ip = a.ip || "desconocida"
    ipCountUser[ip] = (ipCountUser[ip] || 0) + 1
  }
  const topIpsUser = Object.entries(ipCountUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }))

  // Usuarios con más intentos fallidos
  const byUser: Record<string, number> = {}
  for (const a of userFallidos) {
    const u = a.username_ingresado || "desconocido"
    byUser[u] = (byUser[u] || 0) + 1
  }
  const topUsersConFallos = Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([usuario, intentos]) => ({ usuario, intentos }))

  // Serie diaria usuarios
  const byDayUser: Record<string, { fallidos: number; exitosos: number }> = {}
  for (const a of userAttempts) {
    const d = new Date(a.fecha).toISOString().split("T")[0]
    if (!byDayUser[d]) byDayUser[d] = { fallidos: 0, exitosos: 0 }
    if (a.tipo === "fallido") byDayUser[d].fallidos++
    else byDayUser[d].exitosos++
  }
  const serieDiariaUsers = Object.entries(byDayUser)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dia, v]) => ({ dia, ...v }))

  // Últimos 20 intentos fallidos combinados (SA + usuarios)
  const recientes = [
    ...saFallidos.slice(0, 10).map((a) => ({ ...a, origen: "superadmin" })),
    ...userFallidos.slice(0, 10).map((a) => ({ ...a, origen: "usuario" })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 20)
    .map((a) => ({
      origen: a.origen,
      tipo: a.tipo,
      username: a.username_ingresado || "—",
      ip: a.ip || "desconocida",
      user_agent: (a.user_agent || "").slice(0, 80),
      fecha: a.fecha,
      motivo: a.motivo || "—",
    }))

  return NextResponse.json({
    superadmin: {
      totalFallidos: saFallidos.length,
      totalExitosos: saExitosos.length,
      topIps: topIpsSa,
      serieDiaria: serieDiariaSa,
      serieHora: serieHoraSa,
      ultimos: saFallidos.slice(0, 10).map((a) => ({
        ip: a.ip,
        user_agent: (a.user_agent || "").slice(0, 80),
        fecha: a.fecha,
        motivo: a.motivo,
        username: a.username_ingresado,
      })),
    },
    usuarios: {
      totalFallidos: userFallidos.length,
      totalExitosos: userAttempts.filter((a) => a.tipo === "exitoso").length,
      topIps: topIpsUser,
      topUsersConFallos,
      serieDiaria: serieDiariaUsers,
    },
    recientes,
  })
})

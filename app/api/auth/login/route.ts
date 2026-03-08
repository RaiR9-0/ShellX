import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { verifyPassword, createSession } from "@/lib/auth"
import { setupActivationCodes } from "@/lib/db-setup"

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "desconocida"
  )
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    }

    console.log("[v0] Login attempt for:", username)
    const db = await getProjectDb()

    // Ensure activation codes exist
    await setupActivationCodes()

    const safeUser = escapeRegex(username.trim())
    const user = await db.collection("users").findOne({
      username: { $regex: `^${safeUser}$`, $options: "i" },
    })

    const ip = getClientIp(request)
    const ua = request.headers.get("user-agent") || "desconocido"

    if (!user) {
      console.log("[v0] User not found:", username)
      await db.collection("login_attempts").insertOne({
        tipo: "fallido",
        username_ingresado: username,
        ip,
        user_agent: ua,
        fecha: new Date(),
        motivo: "usuario_no_encontrado",
      })
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      console.log("[v0] Invalid password for:", username)
      await db.collection("login_attempts").insertOne({
        tipo: "fallido",
        username_ingresado: username,
        ip,
        user_agent: ua,
        fecha: new Date(),
        motivo: "password_incorrecto",
      })
      return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 })
    }

    // Login exitoso
    await db.collection("login_attempts").insertOne({
      tipo: "exitoso",
      username_ingresado: username,
      ip,
      user_agent: ua,
      fecha: new Date(),
      motivo: "autenticacion_correcta",
      database_name: user.database_name,
    })

    await createSession({
      username: user.username,
      userDbName: user.database_name,
      email: user.email,
    })

    console.log("[v0] Login successful for:", user.username, "DB:", user.database_name)

    return NextResponse.json({
      success: true,
      username: user.username,
      database_name: user.database_name,
    })
  } catch (e: unknown) {
    console.error("[v0] Login error:", e)
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

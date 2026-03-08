import { withSaAuth } from "@/lib/sa-auth"
import { NextResponse } from "next/server"
import { getClient } from "@/lib/mongodb"

export const GET = withSaAuth(async ({ db }) => {
  // Obtener todos los usuarios registrados en la BD proyecto
  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray()

  const client = await getClient()

  const result = await Promise.all(
    users.map(async (u) => {
      const userDbName: string = u.database_name || ""
      let stats = {
        productos: 0,
        ventas: 0,
        compras: 0,
        empleados: 0,
        sucursales: 0,
        ultima_venta: null as Date | null,
      }

      if (userDbName) {
        try {
          const udb = client.db(userDbName)
          const [productos, ventas, compras, empleados, sucursales, ultimaVenta] = await Promise.all([
            udb.collection("productos").countDocuments(),
            udb.collection("ventas").countDocuments(),
            udb.collection("compras").countDocuments(),
            udb.collection("empleados").countDocuments({ activo: true }),
            udb.collection("sucursales").countDocuments({ activo: true }),
            udb.collection("ventas").findOne({}, { sort: { fecha: -1 } }),
          ])
          stats = {
            productos,
            ventas,
            compras,
            empleados,
            sucursales,
            ultima_venta: ultimaVenta?.fecha || null,
          }
        } catch {
          // BD vacía o sin acceso
        }
      }

      return {
        _id: String(u._id),
        username: u.username,
        email: u.email || "",
        phone: u.phone || "",
        database_name: userDbName,
        createdAt: u.createdAt || null,
        stats,
      }
    })
  )

  return NextResponse.json(result)
})

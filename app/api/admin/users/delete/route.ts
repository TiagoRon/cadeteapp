import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Función para verificar si el usuario actual es administrador
async function isAdmin() {
  try {
    // Crear cliente de Supabase en el servidor
    const cookieStore = cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            cookieStore.delete(name, options)
          },
        },
      },
    )

    // Obtener la sesión actual
    const {
      data: { session },
    } = await supabaseServer.auth.getSession()

    if (!session) {
      console.log("No hay sesión activa")
      return false
    }

    // Verificar si el usuario tiene el rol de administrador
    const isUserAdmin = session.user.app_metadata?.role === "admin"
    console.log("¿Es administrador?", isUserAdmin, session.user.app_metadata)

    return isUserAdmin
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Get user ID from request body
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }

    // Delete user from Supabase
    const { error } = await supabase.from("cadetes").delete().eq("id", profileId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("Error in delete user API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

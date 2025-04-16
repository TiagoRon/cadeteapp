import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Obtener información sobre la tabla cadetes
    const { data: tableInfo, error: tableError } = await supabase.from("cadetes").select("*").limit(10)

    if (tableError) {
      return NextResponse.json(
        { error: "Error al obtener información de la tabla", details: tableError },
        { status: 500 },
      )
    }

    // Obtener información sobre la sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        { error: "Error al obtener información de la sesión", details: sessionError },
        { status: 500 },
      )
    }

    // Obtener información sobre el usuario actual
    let userData = null
    let userProfile = null
    let userError = null
    let profileError = null

    if (sessionData.session?.user) {
      const userId = sessionData.session.user.id

      // Obtener datos del usuario
      const { data: user, error } = await supabase.auth.getUser()
      userData = user
      userError = error

      // Obtener perfil del usuario
      const { data: profile, error: pError } = await supabase.from("cadetes").select("*").eq("user_id", userId)

      userProfile = profile
      profileError = pError
    }

    return NextResponse.json({
      status: "success",
      tableInfo: {
        count: tableInfo.length,
        sample: tableInfo,
      },
      session: sessionData,
      user: userData,
      userError,
      userProfile,
      profileError,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 })
  }
}

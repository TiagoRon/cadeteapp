import { supabase } from "@/lib/supabase"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  console.log("Auth callback:", { code: !!code, error, error_description })

  // Si hay un error, redirigir a la página de login con el mensaje de error
  if (error) {
    console.error("Error en el callback de autenticación:", error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin),
    )
  }

  // Si hay un código, intercambiarlo por una sesión
  if (code) {
    try {
      console.log("Intercambiando código por sesión...")
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        throw error
      }

      console.log("Sesión creada correctamente:", !!data.session)

      // Redireccionar a la página de carga para validación
      return NextResponse.redirect(new URL("/auth/loading", requestUrl.origin))
    } catch (error) {
      console.error("Error al intercambiar código por sesión:", error)
      // En caso de error, redirigir a la página de login
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Error al procesar la autenticación")}`, requestUrl.origin),
      )
    }
  }

  // Si no hay código ni error, redirigir a la página de login
  return NextResponse.redirect(new URL("/login", requestUrl.origin))
}

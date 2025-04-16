"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleIcon } from "@/components/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { Loader2, Mail, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { isLoading: authLoading, user } = useAuth()

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // Cargar configuración de login con Google
  useEffect(() => {
    const googleLoginSetting = localStorage.getItem("googleLoginEnabled")
    if (googleLoginSetting !== null) {
      setGoogleLoginEnabled(googleLoginSetting === "true")
    }
  }, [])

  // Obtener error de la URL si existe
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setLoginAttempts((prev) => prev + 1)
    }
  }, [])

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Iniciando sesión con Google...")

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
            access_type: "offline",
          },
        },
      })

      if (error) throw error

      // Si tenemos una URL para redirigir, lo hacemos
      if (data?.url) {
        console.log("Redirigiendo a:", data.url)
        window.location.href = data.url
      }

      setLoginAttempts((prev) => prev + 1)
    } catch (error: any) {
      console.error("Error de autenticación:", error)
      setError(error.message || "Error al iniciar sesión con Google")
      setLoginAttempts((prev) => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para iniciar sesión con email y contraseña
  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("Iniciando sesión con email y contraseña...")

      if (!email || !password) {
        throw new Error("Por favor, ingrese su correo electrónico y contraseña")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Redireccionar a la página de carga para validación
      router.push("/auth/loading")
    } catch (error: any) {
      console.error("Error de autenticación:", error)
      setError(error.message || "Error al iniciar sesión. Verifique sus credenciales.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-600 dark:text-blue-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-blue-100 dark:border-gray-700">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">Viajes Cadete</CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">Inicia sesión para continuar</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulario de login con email y contraseña */}
          <form onSubmit={signInWithEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="email"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="password"
                  placeholder="Contraseña"
                  type="password"
                  className="pl-8"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Separador */}
          {googleLoginEnabled && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">O continúa con</span>
              </div>
            </div>
          )}

          {/* Botón de Google */}
          {googleLoginEnabled && (
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-5 border-2 hover:bg-blue-50 dark:hover:bg-gray-700"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5" />
                  Continuar con Google
                </>
              )}
            </Button>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Alert className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 mb-4">
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                ¿Problemas para iniciar sesión? Prueba el modo de demostración para acceder sin cuenta.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              className="w-full border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              onClick={() => router.push("/demo")}
            >
              Entrar en modo demostración
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col p-6 pt-0">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

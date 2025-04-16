"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function BypassPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para crear una sesión anónima
  const createAnonymousSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Crear un perfil de cadete temporal
      const { data: userData, error: authError } = await supabase.auth.signInWithPassword({
        email: "usuario.temporal@example.com",
        password: "password123",
      })

      if (authError) {
        // Si falla el inicio de sesión, intentar crear el usuario
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: "usuario.temporal@example.com",
          password: "password123",
        })

        if (signUpError) {
          throw signUpError
        }

        // Si se creó el usuario, iniciar sesión
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: "usuario.temporal@example.com",
          password: "password123",
        })

        if (loginError) {
          throw loginError
        }
      }

      // Crear un perfil de cadete temporal si no existe
      const { error: profileError } = await supabase.from("cadetes").upsert({
        user_id: userData?.user?.id || "temp-user-id",
        name: "Usuario",
        last_name: "Temporal",
        cadete_id: "TEMP-001",
        transport_type: "bicicleta",
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Error al crear perfil temporal:", profileError)
      }

      // Redirigir a la página principal
      router.push("/")
    } catch (error: any) {
      console.error("Error en bypass:", error)
      setError(error.message || "Ha ocurrido un error al crear la sesión temporal.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-yellow-100 dark:border-yellow-900">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Acceso de emergencia
          </CardTitle>
          <CardDescription className="text-yellow-600 dark:text-yellow-400">
            Esta página te permite acceder a la aplicación sin pasar por el proceso normal de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800">
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Esta es una solución temporal mientras resolvemos los problemas de autenticación. Utiliza esta opción solo
              si no puedes acceder a la aplicación normalmente.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600"
            onClick={createAnonymousSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creando acceso...
              </>
            ) : (
              "Acceder a la aplicación"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

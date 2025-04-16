"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

export default function DemoPage() {
  const router = useRouter()
  const { enableDemoMode, isLoading, user } = useAuth()

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (user && !isLoading) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Función para habilitar el modo demo y redirigir a la página de carga
  const handleEnableDemoMode = () => {
    enableDemoMode()
    router.push("/auth/loading")
  }

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
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
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">Modo de demostración</CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Accede a la aplicación sin necesidad de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            El modo de demostración te permite usar todas las funcionalidades de la aplicación sin necesidad de crear
            una cuenta o iniciar sesión. Los datos se guardarán localmente en tu navegador.
          </p>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            onClick={handleEnableDemoMode}
          >
            Entrar en modo demostración
          </Button>

          <div className="text-center mt-4">
            <Button
              variant="link"
              className="text-sm text-gray-500 dark:text-gray-400"
              onClick={() => router.push("/login")}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

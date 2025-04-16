"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { demoMode } from "@/lib/demo-mode"

export function AuthLoading() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Validando credenciales...")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const validateUser = async () => {
      try {
        // Check if in demo mode
        if (demoMode.isEnabled()) {
          setStatus("success")
          setMessage("Modo demostración activado. Redirigiendo...")
          startCountdown()
          return
        }

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error("No se encontró una sesión activa")
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("cadetes")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (profileError) {
          // If no profile exists, redirect to onboarding
          if (profileError.code === "PGRST116") {
            setStatus("success")
            setMessage("Necesitamos algunos datos adicionales. Redirigiendo...")
            setTimeout(() => {
              router.push("/onboarding")
            }, 1500)
            return
          }
          throw profileError
        }

        // If everything is valid, show success and redirect
        setStatus("success")
        setMessage("Autenticación exitosa. Redirigiendo...")
        startCountdown()
      } catch (error) {
        console.error("Error validando usuario:", error)
        setStatus("error")
        setMessage(`Error de autenticación: ${error.message || "Intente nuevamente"}`)

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    const startCountdown = () => {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push("/")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    validateUser()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-blue-100 dark:border-gray-700">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
              <p className="text-lg font-medium text-blue-800 dark:text-blue-300">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Por favor espere mientras verificamos su información...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <p className="text-lg font-medium text-green-800 dark:text-green-300">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirigiendo en {countdown} segundos...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
              <p className="text-lg font-medium text-red-800 dark:text-red-300">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Redirigiendo a la página de inicio de sesión...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

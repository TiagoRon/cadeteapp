"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Bike, Loader2, AlertCircle, BikeIcon as Motorcycle } from "lucide-react" // Added Motorcycle icon
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { LoadingScreen } from "@/components/loading-screen" // Fixed import path

// Esquema de validación
const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  cadeteId: z.string().min(1, {
    message: "El ID de cadete es obligatorio.",
  }),
  transportType: z.enum(["bicicleta", "moto"], {
    required_error: "Debes seleccionar un tipo de transporte.",
  }),
})

// Add a check to handle the case when the auth context is not yet available
export default function OnboardingPage() {
  const router = useRouter()
  const { user, refreshProfile, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [contextReady, setContextReady] = useState(false)

  // Check if the auth context is ready
  useEffect(() => {
    // If authLoading is false, it means the context has been initialized
    if (!authLoading) {
      setContextReady(true)
    }
  }, [authLoading])

  // Configurar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      cadeteId: "",
      transportType: undefined,
    },
  })

  // Función para mostrar información de depuración
  const addDebugInfo = (message: string) => {
    console.log(message)
    setDebugInfo((prev) => (prev ? `${prev}\n${message}` : message))
  }

  // useEffect para redirigir si el usuario ya tiene perfil guardado
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (user) {
        const { data: existingProfile, error } = await supabase
          .from("cadetes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle() // Devuelve un objeto o null si no existe
        if (error) {
          addDebugInfo(`Error al verificar perfil: ${error.message}`)
        }
        if (existingProfile) {
          setSuccess("Perfil ya existente. Redirigiendo...")
          setTimeout(() => {
            router.push("/")
          }, 1500)
        }
      }
    }
    checkExistingProfile()
  }, [user, router])

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      setError("No se ha detectado un usuario. Por favor, inicia sesión de nuevo.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    try {
      addDebugInfo(`Guardando datos para usuario: ${user.id}`)
      addDebugInfo(`Datos a guardar: ${JSON.stringify(values)}`)

      // Verificar si ya existe un perfil para este usuario
      const { data: existingProfile, error: queryError } = await supabase
        .from("cadetes")
        .select("id, user_id")
        .eq("user_id", user.id)

      if (queryError) {
        addDebugInfo(`Error al verificar perfil existente: ${queryError.message}`)
        throw queryError
      }

      addDebugInfo(`Resultado de la consulta de perfil existente: ${JSON.stringify(existingProfile)}`)

      if (existingProfile && existingProfile.length > 0) {
        // Si ya existe, redirigir inmediatamente
        addDebugInfo(`Perfil existente encontrado con ID: ${existingProfile[0].id}. Redirigiendo...`)
        setSuccess("Perfil ya existe. Redirigiendo...")
        setTimeout(() => router.push("/"), 1500)
        return
      } else {
        // Si no existe, insertar el nuevo perfil
        addDebugInfo(`No se encontró perfil existente. Creando nuevo perfil...`)

        const insertData = {
          user_id: user.id,
          name: values.name,
          last_name: values.lastName,
          cadete_id: values.cadeteId,
          transport_type: values.transportType,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        addDebugInfo(`Datos de inserción: ${JSON.stringify(insertData)}`)

        const { data, error: insertError } = await supabase.from("cadetes").insert(insertData).select()

        if (insertError) {
          addDebugInfo(`Error al insertar perfil: ${insertError.message}`)
          throw insertError
        }

        addDebugInfo(`Perfil creado correctamente: ${JSON.stringify(data)}`)
      }

      // Mensaje de éxito y actualización del perfil en el contexto
      setSuccess("Perfil guardado correctamente. Redirigiendo...")
      await refreshProfile()
      addDebugInfo("Perfil actualizado en el contexto")
      setTimeout(() => {
        addDebugInfo("Redirigiendo a la página principal...")
        router.push("/")
      }, 2000)
    } catch (error: any) {
      console.error("Error en onboarding:", error)
      setError(`Error al guardar datos: ${error.message || "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state until the auth context is ready
  if (!contextReady || authLoading) {
    return <LoadingScreen message="Inicializando aplicación..." />
  }

  // Si no se detecta un usuario, muestra un mensaje de error
  if (!user && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-100 dark:border-red-900">
          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                No se ha detectado un usuario. Por favor, inicia sesión para continuar.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Ir a la página de login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg shadow-lg border-blue-100 dark:border-gray-700">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg p-6">
          <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">Completa tu perfil</CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Necesitamos algunos datos adicionales para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Mostrar errores, mensajes de éxito o depuración */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Alert className="mb-4 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <AlertDescription className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-xs">
                <strong>Información de depuración:</strong>
                <br />
                {debugInfo}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cadeteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Cadete</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu ID de cadete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transportType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Transporte</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                          <RadioGroupItem value="bicicleta" id="bicicleta" />
                          <FormLabel htmlFor="bicicleta" className="flex items-center cursor-pointer">
                            <Bike className="mr-2 h-5 w-5 text-blue-500" />
                            Bicicleta
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                          <RadioGroupItem value="moto" id="moto" />
                          <FormLabel htmlFor="moto" className="flex items-center cursor-pointer">
                            <Motorcycle className="mr-2 h-5 w-5 text-blue-500" />
                            Moto
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar y Continuar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

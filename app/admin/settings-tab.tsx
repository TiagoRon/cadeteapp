"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, AlertCircle, CheckCircle } from "lucide-react"
import { appConfig } from "@/lib/config"

export default function SettingsTab() {
  const [pricePerKm, setPricePerKm] = useState(appConfig.pricePerKm.toString())
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Cargar configuración actual
  useEffect(() => {
    setPricePerKm(appConfig.getPricePerKm().toString())

    // Cargar configuración de login con Google
    const googleLoginSetting = localStorage.getItem("googleLoginEnabled")
    if (googleLoginSetting !== null) {
      setGoogleLoginEnabled(googleLoginSetting === "true")
    } else {
      // Por defecto está habilitado si no hay configuración
      setGoogleLoginEnabled(true)
      localStorage.setItem("googleLoginEnabled", "true")
    }
  }, [])

  // Manejar cambio de precio
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPricePerKm(e.target.value)
  }

  // Manejar cambio en el switch de Google Login
  const handleGoogleLoginChange = (checked: boolean) => {
    setGoogleLoginEnabled(checked)
  }

  // Guardar configuración
  const saveSettings = () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validar que el precio sea un número válido
      const price = Number.parseFloat(pricePerKm)
      if (isNaN(price) || price <= 0) {
        throw new Error("El precio debe ser un número positivo")
      }

      // Guardar el precio
      appConfig.setPricePerKm(price)

      // Guardar configuración de login con Google
      localStorage.setItem("googleLoginEnabled", googleLoginEnabled.toString())

      // Mostrar mensaje de éxito
      setSuccess("Configuración guardada correctamente")
    } catch (error: any) {
      setError(error.message || "Error al guardar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Configuración del Sistema</CardTitle>
        <CardDescription>Ajusta los parámetros de funcionamiento de la aplicación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de precios */}
        <div>
          <h3 className="text-lg font-medium mb-4">Configuración de Precios</h3>
          <Separator className="mb-4" />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pricePerKm">Precio por kilómetro (en pesos)</Label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500">$</span>
                <Input
                  id="pricePerKm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerKm}
                  onChange={handlePriceChange}
                  className="max-w-[200px]"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Este valor se utiliza para calcular el precio de los viajes basado en la distancia recorrida.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de autenticación */}
        <div>
          <h3 className="text-lg font-medium mb-4">Configuración de Autenticación</h3>
          <Separator className="mb-4" />

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="google-login">Inicio de sesión con Google</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permite a los usuarios iniciar sesión utilizando sus cuentas de Google.
                </p>
              </div>
              <Switch id="google-login" checked={googleLoginEnabled} onCheckedChange={handleGoogleLoginChange} />
            </div>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2 text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

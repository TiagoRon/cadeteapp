"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function DebugPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug")
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      setDebugData(data)
    } catch (error: any) {
      console.error("Error al obtener información de depuración:", error)
      setError(error.message || "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4 border-yellow-300 dark:border-yellow-700">
      <CardHeader className="bg-yellow-50 dark:bg-yellow-900">
        <CardTitle className="text-yellow-800 dark:text-yellow-300 text-sm">Panel de Depuración</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Button
          onClick={fetchDebugInfo}
          disabled={isLoading}
          className="mb-4 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Verificar Estado"
          )}
        </Button>

        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md mb-4 text-xs">
            {error}
          </div>
        )}

        {debugData && (
          <div className="overflow-auto max-h-96">
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

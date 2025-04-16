"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Bug } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

export function AdminDebug() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { isDemoMode, user } = useAuth()

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from("cadetes").select("count")
      if (error) throw error
      return { success: true, count: data[0]?.count || 0 }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const connectionStatus = await checkSupabaseConnection()

      // Get environment variables (only the ones that are safe to expose)
      const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set",
      }

      // Get demo mode status
      const demoModeStatus = {
        isDemoMode,
        demoModeLocalStorage: typeof window !== "undefined" ? localStorage.getItem("demoMode") : null,
      }

      // Get auth status
      const authStatus = {
        isAuthenticated: !!user,
        userId: user?.id || null,
      }

      // Try to get users directly
      let usersData = null
      let usersError = null
      try {
        const { data, error } = await supabase.from("cadetes").select("*").limit(5)
        usersData = data
        usersError = error
      } catch (e: any) {
        usersError = e.message
      }

      setDebugData({
        timestamp: new Date().toISOString(),
        connectionStatus,
        envVars,
        demoModeStatus,
        authStatus,
        users: {
          data: usersData,
          error: usersError,
          count: usersData?.length || 0,
        },
      })
    } catch (error: any) {
      console.error("Error fetching debug info:", error)
      setError(error.message || "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4 border-yellow-300 dark:border-yellow-700">
      <CardHeader className="bg-yellow-50 dark:bg-yellow-900 py-2">
        <CardTitle className="text-yellow-800 dark:text-yellow-300 text-sm flex items-center">
          <Bug className="h-4 w-4 mr-2" />
          Admin Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Button
          onClick={fetchDebugInfo}
          disabled={isLoading}
          className="mb-4 bg-yellow-600 hover:bg-yellow-700 text-white"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Check System Status"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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

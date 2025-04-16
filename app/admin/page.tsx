"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Users, Calendar, Settings, ArrowLeft, Map, Briefcase } from "lucide-react"
import UsersTab from "./users-tab"
import TripsTab from "./trips-tab"
import SettingsTab from "./settings-tab"
import MapTab from "./map-tab"
import AssignTripsTab from "./assign-trips-tab"
import { AdminDebug } from "@/components/admin-debug"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  const [supabaseConfigured] = useState(isSupabaseConfigured())

  // Redireccionar si el usuario no es administrador
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/")
    }
  }, [isAdmin, isLoading, router])

  // Mostrar pantalla de carga mientras se verifica si el usuario es administrador
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

  // Si no es administrador, no mostrar nada (se redirigirá en el useEffect)
  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Panel de Administración</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Viajes</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Asignar Viajes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab supabaseConfigured={supabaseConfigured} />
          </TabsContent>

          <TabsContent value="trips">
            <TripsTab />
          </TabsContent>

          <TabsContent value="map">
            <MapTab />
          </TabsContent>

          <TabsContent value="assign">
            <AssignTripsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
            <AdminDebug />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

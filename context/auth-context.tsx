"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { demoUser, demoProfile, demoMode } from "@/lib/demo-mode"
import type { Session, User } from "@supabase.supabase-js"
import type { Database } from "@/lib/supabase"

type CadeteProfile = Database["public"]["Tables"]["cadetes"]["Row"]
type AuthContextType = {
  user: User | null
  session: Session | null
  profile: CadeteProfile | null
  isLoading: boolean
  hasCompletedOnboarding: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isDemoMode: boolean
  enableDemoMode: () => void
  disableDemoMode: () => void
  createUser: (userData: any) => Promise<any>
  deleteUser: (userId: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<CadeteProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [contextReady, setContextReady] = useState(false)

  // Función para verificar si el usuario es administrador
  const checkIsAdmin = (user: User | null) => {
    if (!user) return false

    // En modo de demostración, el usuario demo es admin
    if (demoMode.isEnabled()) {
      return true
    }

    // Verificar si el usuario tiene el rol de administrador en los metadatos
    return user.app_metadata?.role === "admin"
  }

  // Función para habilitar el modo de demostración
  const enableDemoMode = () => {
    demoMode.enable()
    setIsDemoMode(true)
    setUser(demoUser)
    setProfile(demoProfile)
    setHasCompletedOnboarding(true)
    setIsAdmin(true)
    router.push("/")
  }

  // Función para deshabilitar el modo de demostración
  const disableDemoMode = () => {
    demoMode.disable()
    setIsDemoMode(false)
    setUser(null)
    setProfile(null)
    setHasCompletedOnboarding(false)
    setIsAdmin(false)
    router.push("/login")
  }

  // Función para crear un nuevo usuario (para administradores)
  const createUser = async (userData: any) => {
    if (isDemoMode) {
      // En modo demo, simular creación
      console.log("Modo demo: Creando nuevo usuario", userData)

      // Simular un pequeño retraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Añadir el usuario a los usuarios demostrativos
      const newUser = {
        id: userData.id || `demo-${Date.now()}`,
        user_id: userData.user_id || `demo-${Date.now()}`,
        name: userData.name,
        last_name: userData.lastName,
        cadete_id: userData.cadeteId,
        transport_type: userData.transportType,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      demoMode.addUser(newUser)

      return {
        success: true,
        data: { id: newUser.id, profile: newUser },
      }
    }

    try {
      // Crear usuario en Supabase Auth
      // Nota: Esta operación puede fallar en el frontend debido a restricciones de permisos
      // Idealmente, esto debería hacerse a través de una API serverless
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        app_metadata: {
          role: userData.isAdmin ? "admin" : "user",
        },
        user_metadata: {
          name: userData.name,
          last_name: userData.lastName,
        },
      })

      if (authError) {
        console.error("Error al crear usuario en Auth:", authError)

        // Si falla la creación del usuario de autenticación, intentamos crear solo el perfil
        // con un ID temporal (esto es solo para demostración, no es una solución real)
        const tempUserId = `temp-${Date.now()}`

        const { data: profileData, error: profileError } = await supabase
          .from("cadetes")
          .insert({
            user_id: tempUserId,
            name: userData.name,
            last_name: userData.lastName,
            cadete_id: userData.cadeteId,
            transport_type: userData.transportType,
            onboarding_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (profileError) throw profileError

        return {
          success: true,
          partial: true,
          message: "Se creó el perfil pero no la cuenta de autenticación. Contacte al administrador.",
          data: { profile: profileData },
        }
      }

      // Crear perfil de cadete
      const { data: profileData, error: profileError } = await supabase
        .from("cadetes")
        .insert({
          user_id: authData.user.id,
          name: userData.name,
          last_name: userData.lastName,
          cadete_id: userData.cadeteId,
          transport_type: userData.transportType,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) throw profileError

      return { success: true, data: { auth: authData, profile: profileData } }
    } catch (error) {
      console.error("Error al crear usuario:", error)
      return { success: false, error }
    }
  }

  // Función para eliminar un usuario (para administradores)
  const deleteUser = async (userId: string) => {
    if (isDemoMode) {
      // En modo demo, simular eliminación
      console.log("Modo demo: Eliminando usuario", userId)

      // Simular un pequeño retraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Eliminar el usuario usando la función del módulo demoMode
      const success = demoMode.removeUser(userId)

      if (!success) {
        return { success: false, error: "Error al eliminar usuario en modo demo" }
      }

      return { success: true }
    }

    try {
      // En modo real, usar la API para eliminar el usuario
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar usuario")
      }

      const result = await response.json()

      return {
        success: true,
        message: result.message || "Usuario eliminado correctamente",
      }
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error)
      return { success: false, error: error.message || "Error desconocido" }
    }
  }

  // Función para cargar el perfil del usuario
  const refreshProfile = async () => {
    if (!user) return

    // Si estamos en modo de demostración, usar el perfil de demostración
    if (demoMode.isEnabled()) {
      setProfile(demoProfile)
      setHasCompletedOnboarding(true)
      setIsAdmin(true)
      return
    }

    try {
      console.log("Cargando perfil para usuario:", user.id)

      // Usar una consulta básica sin .single() para evitar errores
      const { data, error } = await supabase.from("cadetes").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error al cargar perfil:", error)
        return
      }

      // Verificar si tenemos datos y cuántos registros hay
      console.log(`Perfiles encontrados: ${data?.length || 0}`)

      if (!data || data.length === 0) {
        // No se encontró perfil
        console.log("No se encontró perfil para el usuario, redirigiendo a onboarding")
        setProfile(null)
        setHasCompletedOnboarding(false)

        // Solo redirigir si no estamos ya en la página de onboarding
        if (pathname !== "/onboarding") {
          router.push("/onboarding")
        }
        return
      }

      if (data.length > 1) {
        // Se encontraron múltiples perfiles - esto no debería ocurrir
        console.warn(`Se encontraron ${data.length} perfiles para el usuario ${user.id}. Usando el primero.`)
      }

      // Usar el primer perfil encontrado
      const userProfile = data[0]
      console.log("Perfil cargado:", userProfile)

      // Verificar explícitamente si el onboarding está completado
      const onboardingCompleted = userProfile?.onboarding_completed === true
      console.log("Estado de onboarding:", onboardingCompleted ? "Completado" : "Pendiente")

      setProfile(userProfile)
      setHasCompletedOnboarding(onboardingCompleted)

      // Si el onboarding no está completado, redirigir a la página de onboarding
      if (!onboardingCompleted && pathname !== "/onboarding") {
        console.log("Onboarding no completado, redirigiendo...")
        router.push("/onboarding")
      }

      // Verificar si el usuario es administrador
      setIsAdmin(checkIsAdmin(user))
    } catch (error: any) {
      console.error("Error al cargar perfil:", error)
      // No redirigir en caso de error técnico para evitar loops
    }
  }

  // Inicialización: verificar modo de demostración y obtener sesión actual
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      try {
        // Verificar si el modo de demostración está habilitado
        const isDemoEnabled = demoMode.isEnabled()
        setIsDemoMode(isDemoEnabled)

        if (isDemoEnabled) {
          console.log("Modo de demostración habilitado")
          setUser(demoUser)
          setProfile(demoProfile)
          setHasCompletedOnboarding(true)
          setIsAdmin(true)
          setAuthInitialized(true)
          setIsLoading(false)
          return
        }

        console.log("Inicializando autenticación...")
        // Obtener sesión actual
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error al obtener sesión:", sessionError)
        }

        console.log("Sesión actual:", currentSession ? "Existe" : "No existe")
        setSession(currentSession)
        setUser(currentSession?.user || null)

        // Verificar si el usuario es administrador
        if (currentSession?.user) {
          setIsAdmin(checkIsAdmin(currentSession.user))
        }

        // Configurar listener para cambios de autenticación
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Cambio de estado de autenticación:", _event)
          setSession(session)
          setUser(session?.user || null)

          // Verificar si el usuario es administrador
          if (session?.user) {
            setIsAdmin(checkIsAdmin(session.user))
          } else {
            setIsAdmin(false)
          }
        })

        setAuthInitialized(true)

        // Cleanup
        return () => {
          subscription.unsubscribe()
        }
      } catch (error: any) {
        console.error("Error al inicializar autenticación:", error)
        setAuthInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Cargar perfil cuando hay un usuario autenticado
  useEffect(() => {
    if (user && authInitialized && !isDemoMode) {
      refreshProfile()
    } else if (!user && authInitialized && !isDemoMode) {
      setProfile(null)
      setHasCompletedOnboarding(false)
      setIsAdmin(false)
    }
  }, [user, authInitialized, isDemoMode])

  // Manejar redirecciones basadas en el estado de autenticación
  useEffect(() => {
    if (!authInitialized || isLoading) return

    // Si estamos en modo de demostración, no hacer redirecciones
    if (isDemoMode) return

    // Rutas que no requieren autenticación
    const publicRoutes = ["/login", "/demo"]
    const isPublicRoute = publicRoutes.includes(pathname || "") || pathname?.startsWith("/auth/")

    // Rutas que requieren ser administrador
    const adminRoutes = ["/admin"]
    const isAdminRoute = adminRoutes.some((route) => pathname?.startsWith(route))

    console.log("Verificando redirecciones:", {
      pathname,
      isPublicRoute,
      isAdminRoute,
      user: !!user,
      hasCompletedOnboarding,
      isAdmin,
    })

    // Si es una ruta de administrador y el usuario no es administrador, redirigir a la página principal
    if (isAdminRoute && !isAdmin) {
      console.log("Usuario no es administrador, redirigiendo a página principal...")
      router.push("/")
      return
    }

    // Si es una ruta pública y el usuario está autenticado, redirigir
    if (isPublicRoute && user) {
      console.log("Usuario autenticado en ruta pública, redirigiendo...")
      if (!hasCompletedOnboarding) {
        router.push("/onboarding")
      } else {
        router.push("/")
      }
      return
    }

    // Si no es una ruta pública y el usuario no está autenticado, redirigir al login
    if (!isPublicRoute && !user) {
      console.log("Usuario no autenticado en ruta protegida, redirigiendo a login...")
      router.push("/login")
      return
    }

    // Si el usuario está autenticado pero no ha completado onboarding y no está en la página de onboarding
    if (user && !hasCompletedOnboarding && pathname !== "/onboarding" && pathname !== "/login") {
      console.log("Usuario sin onboarding completo, redirigiendo a onboarding...")
      router.push("/onboarding")
      return
    }
  }, [user, hasCompletedOnboarding, pathname, authInitialized, isLoading, router, isDemoMode, isAdmin])

  // Función para cerrar sesión
  const signOut = async () => {
    if (isDemoMode) {
      disableDemoMode()
      return
    }

    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Marcar el contexto como listo después de la inicialización
  useEffect(() => {
    if (authInitialized) {
      setContextReady(true)
    }
  }, [authInitialized])

  // Proporcionar un valor por defecto mientras el contexto se inicializa
  if (!contextReady && typeof window !== "undefined") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"></div>
          <p className="text-blue-600 dark:text-blue-400">Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  const value = {
    user,
    session,
    profile,
    isLoading,
    hasCompletedOnboarding,
    isAdmin,
    signOut,
    refreshProfile,
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
    createUser,
    deleteUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Instead of throwing an error, return a default context with loading state
    return {
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      hasCompletedOnboarding: false,
      isAdmin: false,
      signOut: async () => {},
      refreshProfile: async () => {},
      isDemoMode: false,
      enableDemoMode: () => {},
      disableDemoMode: () => {},
      createUser: async () => ({ success: false, error: "Auth context not available" }),
      deleteUser: async () => ({ success: false, error: "Auth context not available" }),
    }
  }
  return context
}

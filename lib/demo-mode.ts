import type { User } from "@supabase/supabase-js"
import type { Database } from "./supabase"
import { demoTrips } from "./config"

// Import demoUsers but don't export it directly - we'll manage it through our functions
import { demoUsers as initialDemoUsers } from "./config"

// Usuario de demostración
export const demoUser: User = {
  id: "demo-user-id",
  app_metadata: {
    role: "admin", // Añadimos el rol de administrador
  },
  user_metadata: {
    name: "Usuario Demo",
    email: "demo@example.com",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "demo@example.com",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
}

// Perfil de demostración
export const demoProfile: Database["public"]["Tables"]["cadetes"]["Row"] = {
  id: "demo-profile-id",
  user_id: demoUser.id,
  name: "Usuario",
  last_name: "Administrador",
  cadete_id: "ADMIN-001",
  transport_type: "bicicleta",
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Initialize localStorage with default users if it doesn't exist yet
const initializeLocalStorage = () => {
  if (typeof window === "undefined") return

  // Check if we've already initialized
  if (localStorage.getItem("demoModeInitialized") === "true") return

  try {
    // Initialize with default users
    localStorage.setItem("demoUsers", JSON.stringify(initialDemoUsers))
    localStorage.setItem("deletedDemoUsers", JSON.stringify([]))
    localStorage.setItem("demoModeInitialized", "true")
    console.log("Demo mode initialized with default users")
  } catch (e) {
    console.error("Error initializing demo mode localStorage:", e)
  }
}

// Estado del modo de demostración
export const demoMode = {
  enabled: false,
  enable: () => {
    demoMode.enabled = true
    if (typeof window !== "undefined") {
      localStorage.setItem("demoMode", "true")
      // Initialize localStorage when enabling demo mode
      initializeLocalStorage()
    }
  },
  disable: () => {
    demoMode.enabled = false
    if (typeof window !== "undefined") {
      localStorage.setItem("demoMode", "false")
    }
  },
  isEnabled: () => {
    if (typeof window !== "undefined") {
      const isDemoMode = localStorage.getItem("demoMode") === "true" || demoMode.enabled
      if (isDemoMode) {
        // Initialize localStorage when checking if demo mode is enabled
        initializeLocalStorage()
      }
      return isDemoMode
    }
    return demoMode.enabled
  },

  // Funciones para obtener datos de demostración
  getUsers: () => {
    if (typeof window === "undefined") return [...initialDemoUsers]

    try {
      // Initialize localStorage if needed
      initializeLocalStorage()

      // Get users from localStorage
      const storedUsers = JSON.parse(localStorage.getItem("demoUsers") || "[]")
      const deletedUserIds = JSON.parse(localStorage.getItem("deletedDemoUsers") || "[]")

      // Filter out deleted users
      return storedUsers.filter((user) => !deletedUserIds.includes(user.id))
    } catch (e) {
      console.error("Error getting demo users:", e)
      return [...initialDemoUsers]
    }
  },

  getTrips: (userId?: string) => {
    if (userId) {
      return demoTrips.filter((trip) => trip.user_id === userId)
    }
    return demoTrips
  },

  // Función para obtener usuarios en línea
  getOnlineUsers: () => {
    const users = demoMode.getUsers()
    return users.filter((user) => user.online)
  },

  // Añadir un nuevo usuario a los usuarios demostrativos
  addUser: (user) => {
    if (typeof window === "undefined") return user

    try {
      // Initialize localStorage if needed
      initializeLocalStorage()

      // Get current users
      const currentUsers = JSON.parse(localStorage.getItem("demoUsers") || "[]")

      // Add new user
      const updatedUsers = [...currentUsers, user]

      // Save to localStorage
      localStorage.setItem("demoUsers", JSON.stringify(updatedUsers))

      console.log("User added successfully:", user)
      return user
    } catch (e) {
      console.error("Error adding demo user:", e)
      return user
    }
  },

  // Eliminar un usuario de los usuarios demostrativos
  removeUser: (userId) => {
    if (typeof window === "undefined") return true

    try {
      // Initialize localStorage if needed
      initializeLocalStorage()

      // Get current users and deleted users
      const currentUsers = JSON.parse(localStorage.getItem("demoUsers") || "[]")
      const deletedUserIds = JSON.parse(localStorage.getItem("deletedDemoUsers") || "[]")

      // Add to deleted users list if not already there
      if (!deletedUserIds.includes(userId)) {
        deletedUserIds.push(userId)
        localStorage.setItem("deletedDemoUsers", JSON.stringify(deletedUserIds))
      }

      // Remove from current users if it exists
      const updatedUsers = currentUsers.filter((user) => user.id !== userId)
      localStorage.setItem("demoUsers", JSON.stringify(updatedUsers))

      console.log("User removed successfully:", userId)
      return true
    } catch (e) {
      console.error("Error removing demo user:", e)
      return false
    }
  },

  // Reset demo mode (for testing)
  reset: () => {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem("demoUsers")
      localStorage.removeItem("deletedDemoUsers")
      localStorage.removeItem("demoModeInitialized")
      console.log("Demo mode reset successfully")
    } catch (e) {
      console.error("Error resetting demo mode:", e)
    }
  },
}

// Initialize localStorage when this module is imported in the browser
if (typeof window !== "undefined") {
  // Only initialize if demo mode is enabled
  if (localStorage.getItem("demoMode") === "true") {
    initializeLocalStorage()
  }
}

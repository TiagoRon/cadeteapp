import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Extender el tipo de Supabase Auth para incluir funciones de administración
declare module "@supabase/supabase-js" {
  interface SupabaseAuthClient {
    admin: {
      createUser: (options: any) => Promise<any>
      deleteUser: (userId: string) => Promise<any>
    }
  }
}

// Crear un singleton client para usar en toda la aplicación
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
)

// Agregar funciones de administración simuladas para Supabase Auth
// Estas funciones serán reemplazadas por las reales cuando se use Supabase Edge Functions
if (!supabase.auth.admin) {
  supabase.auth.admin = {
    createUser: async (options) => {
      // En un entorno real, esto se haría a través de una función de Edge de Supabase
      // Aquí simulamos la creación de usuario usando el método de registro normal
      return supabase.auth.signUp({
        email: options.email,
        password: options.password,
        options: {
          data: {
            ...options.user_metadata,
            role: options.app_metadata?.role || "user",
          },
        },
      })
    },
    deleteUser: async (userId) => {
      // En un entorno real, esto se haría a través de una función de Edge de Supabase
      // Aquí simulamos la eliminación de usuario
      console.log("Simulando eliminación de usuario:", userId)
      return { error: null }
    },
  }
}

// Add a function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Exportar tipos útiles
export type Database = {
  public: {
    Tables: {
      cadetes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          last_name: string
          cadete_id: string
          transport_type: "bicicleta" | "moto"
          onboarding_completed: boolean
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          last_name: string
          cadete_id: string
          transport_type: "bicicleta" | "moto"
          onboarding_completed?: boolean
          user_id: string
        }
        Update: {
          name?: string
          last_name?: string
          cadete_id?: string
          transport_type?: "bicicleta" | "moto"
          onboarding_completed?: boolean
        }
      }
    }
  }
}

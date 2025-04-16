"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Bike, BikeIcon as MotorbikeFast, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function StandaloneUserForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [cadeteId, setCadeteId] = useState("")
  const [transportType, setTransportType] = useState("bicicleta")
  const [isAdminRole, setIsAdminRole] = useState(false)

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset errors and messages
    setError(null)
    setSuccess(null)
    setFormErrors({})

    // Validate form
    const errors: Record<string, string> = {}
    if (!name) errors.name = "El nombre es obligatorio"
    if (!lastName) errors.lastName = "El apellido es obligatorio"
    if (!email) errors.email = "El correo electrónico es obligatorio"
    if (!email.includes("@")) errors.email = "Ingrese un correo electrónico válido"
    if (!password) errors.password = "La contraseña es obligatoria"
    if (password && password.length < 6) errors.password = "La contraseña debe tener al menos 6 caracteres"
    if (!cadeteId) errors.cadeteId = "El ID de cadete es obligatorio"
    if (!transportType) errors.transportType = "Seleccione un tipo de transporte"

    // If there are errors, stop submission
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      // Check if in demo mode
      const isDemoMode = typeof window !== "undefined" && localStorage.getItem("demoMode") === "true"

      if (isDemoMode) {
        // Create a new user object
        const newUser = {
          id: `demo-${Date.now()}`,
          user_id: `demo-${Date.now()}`,
          name: name,
          last_name: lastName,
          cadete_id: cadeteId,
          transport_type: transportType,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          online: false,
        }

        // Get current users from localStorage
        let currentUsers = []
        try {
          const storedUsers = localStorage.getItem("demoUsers")
          if (storedUsers) {
            currentUsers = JSON.parse(storedUsers)
          }
        } catch (e) {
          console.error("Error parsing demo users:", e)
          currentUsers = []
        }

        // Add new user to the list
        currentUsers.push(newUser)

        // Save updated list to localStorage
        localStorage.setItem("demoUsers", JSON.stringify(currentUsers))

        console.log("User added successfully:", newUser)
        setSuccess("Usuario creado correctamente. Recargue la página para ver los cambios.")

        // Reset form
        setName("")
        setLastName("")
        setEmail("")
        setPassword("")
        setCadeteId("")
        setTransportType("bicicleta")
        setIsAdminRole(false)
      } else {
        // In real mode, simulate success
        console.log("Creating user in real mode (simulated):", {
          name,
          lastName,
          email,
          cadeteId,
          transportType,
          isAdmin: isAdminRole,
        })

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setSuccess("Usuario creado correctamente (simulado en modo real).")

        // Reset form
        setName("")
        setLastName("")
        setEmail("")
        setPassword("")
        setCadeteId("")
        setTransportType("bicicleta")
        setIsAdminRole(false)
      }
    } catch (err: any) {
      console.error("Error creating user:", err)
      setError(err.message || "Ha ocurrido un error al crear el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          Crear Nuevo Usuario
        </CardTitle>
        <CardDescription>Complete el formulario para crear un nuevo usuario en el sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del usuario"
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido del usuario"
              />
              {formErrors.lastName && <p className="text-sm text-red-500">{formErrors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
            />
            {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadeteId">ID de Cadete</Label>
            <Input id="cadeteId" value={cadeteId} onChange={(e) => setCadeteId(e.target.value)} placeholder="CAD-001" />
            {formErrors.cadeteId && <p className="text-sm text-red-500">{formErrors.cadeteId}</p>}
          </div>

          <div className="space-y-3">
            <Label>Tipo de Transporte</Label>
            <RadioGroup value={transportType} onValueChange={setTransportType} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                <RadioGroupItem value="bicicleta" id="bicicleta" />
                <Label htmlFor="bicicleta" className="flex items-center cursor-pointer">
                  <Bike className="mr-2 h-5 w-5 text-blue-500" />
                  Bicicleta
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer">
                <RadioGroupItem value="moto" id="moto" />
                <Label htmlFor="moto" className="flex items-center cursor-pointer">
                  <MotorbikeFast className="mr-2 h-5 w-5 text-blue-500" />
                  Moto
                </Label>
              </div>
            </RadioGroup>
            {formErrors.transportType && <p className="text-sm text-red-500">{formErrors.transportType}</p>}
          </div>

          <div className="flex items-start space-x-3 rounded-md border p-4">
            <Checkbox id="isAdmin" checked={isAdminRole} onCheckedChange={setIsAdminRole} />
            <div className="space-y-1 leading-none">
              <Label htmlFor="isAdmin">Administrador</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Este usuario tendrá acceso al panel de administración.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

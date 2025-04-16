"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { demoMode } from "@/lib/demo-mode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, MapPin, Navigation, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { appConfig } from "@/lib/config"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Constante para el viewbox de Gualeguaychú
const GUALEGUAYCHU_VIEWBOX = "-58.6471,-32.8741,-58.3471,-33.1741"

export default function AssignTripsTab() {
  const { isDemoMode } = useAuth()
  const [users, setUsers] = useState([])
  const [assignedTrips, setAssignedTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTrips, setFilteredTrips] = useState([])
  const [tableColumns, setTableColumns] = useState([])
  const [isSnakeCase, setIsSnakeCase] = useState(true) // Por defecto asumimos snake_case

  // Estados para el formulario de asignación
  const [selectedUser, setSelectedUser] = useState("")
  const [origin, setOrigin] = useState("")
  const [destinations, setDestinations] = useState([""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estado para el diálogo de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState(null)

  // Estado para el selector de cadetes
  const [open, setOpen] = useState(false)
  const [userSearchValue, setUserSearchValue] = useState("")

  // Cargar usuarios y viajes asignados
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        let userData = []
        let tripsData = []

        if (isDemoMode) {
          // En modo de demostración, usar datos de demostración
          userData = demoMode.getUsers()
          tripsData = localStorage.getItem("assignedTrips") ? JSON.parse(localStorage.getItem("assignedTrips")) : []
        } else {
          // En modo real, obtener datos de Supabase
          const { data: usersData, error: usersError } = await supabase.from("cadetes").select("*")
          if (usersError) throw usersError
          userData = usersData

          // Obtener viajes asignados de Supabase
          const { data: assignedTripsData, error: tripsError } = await supabase
            .from("assigned_trips")
            .select("*")
            .order("created_at", { ascending: false })

          if (tripsError) throw tripsError
          tripsData = assignedTripsData || []

          // Detectar el esquema de la tabla
          try {
            // Primero intentamos obtener una lista de columnas directamente
            const { data: tableInfo } = await supabase.rpc("get_table_columns", {
              table_name: "assigned_trips",
            })

            if (tableInfo && tableInfo.length > 0) {
              const columnNames = tableInfo.map((col) => col.column_name)
              setTableColumns(columnNames)
              console.log("Columns from RPC:", columnNames)

              // Determinar si usa snake_case o camelCase
              const hasSnakeCase = columnNames.some((col) => col.includes("_"))
              setIsSnakeCase(hasSnakeCase)
              console.log("Using snake_case:", hasSnakeCase)
            } else if (tripsData.length > 0) {
              // Si no podemos obtener el esquema pero tenemos datos, inferimos de la primera fila
              const columnNames = Object.keys(tripsData[0])
              setTableColumns(columnNames)
              console.log("Columns inferred from data:", columnNames)

              // Determinar si usa snake_case o camelCase
              const hasSnakeCase = columnNames.some((col) => col.includes("_"))
              setIsSnakeCase(hasSnakeCase)
              console.log("Using snake_case:", hasSnakeCase)
            } else {
              // Si no tenemos datos ni esquema, asumimos snake_case por defecto
              setIsSnakeCase(true)
              console.log("No schema or data available, defaulting to snake_case")
            }
          } catch (e) {
            console.error("Error fetching schema:", e)
            // Si hay un error, asumimos snake_case por defecto
            setIsSnakeCase(true)
          }
        }

        setUsers(userData)
        setAssignedTrips(tripsData)
        setFilteredTrips(tripsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Error al cargar datos. Por favor, intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isDemoMode])

  // Filtrar viajes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTrips(assignedTrips)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = assignedTrips.filter((trip) => {
      // Check origin address
      if (trip.originAddress && trip.originAddress.toLowerCase().includes(term)) return true
      if (trip.origin_address && trip.origin_address.toLowerCase().includes(term)) return true

      // Check destination address(es)
      if (trip.destinationAddress && trip.destinationAddress.toLowerCase().includes(term)) return true
      if (trip.destination_address && trip.destination_address.toLowerCase().includes(term)) return true

      // Check multiple destinations in various formats
      if (
        trip.destinationAddresses &&
        Array.isArray(trip.destinationAddresses) &&
        trip.destinationAddresses.some((addr) => addr && addr.toLowerCase().includes(term))
      )
        return true
      if (
        trip.destination_addresses &&
        Array.isArray(trip.destination_addresses) &&
        trip.destination_addresses.some((addr) => addr && addr.toLowerCase().includes(term))
      )
        return true
      if (
        trip.destinations &&
        Array.isArray(trip.destinations) &&
        trip.destinations.some((dest) => dest.address && dest.address.toLowerCase().includes(term))
      )
        return true

      // Check user name
      return getUserName(trip.user_id).toLowerCase().includes(term)
    })

    setFilteredTrips(filtered)
  }, [searchTerm, assignedTrips])

  // Obtener nombre de usuario
  const getUserName = (userId) => {
    const user = users.find((u) => u.user_id === userId)
    return user ? `${user.name} ${user.last_name}` : "Usuario desconocido"
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Añadir un nuevo destino
  const addDestination = () => {
    setDestinations([...destinations, ""])
  }

  // Eliminar un destino
  const removeDestination = (index) => {
    if (destinations.length <= 1) return
    const newDestinations = [...destinations]
    newDestinations.splice(index, 1)
    setDestinations(newDestinations)
  }

  // Actualizar un destino
  const updateDestination = (index, value) => {
    const newDestinations = [...destinations]
    newDestinations[index] = value
    setDestinations(newDestinations)
  }

  // Función para calcular la distancia entre dos puntos (coordenadas)
  const calculateDistance = (pointA, pointB) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180
    const dLon = ((pointB.lng - pointA.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pointA.lat * Math.PI) / 180) *
        Math.cos((pointB.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distancia en km
  }

  // Función para geocodificar una dirección (convertir dirección a coordenadas)
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&viewbox=${GUALEGUAYCHU_VIEWBOX}&bounded=1&countrycodes=ar`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error("Error al geocodificar dirección:", error)
      return null
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      // Validar campos
      if (!selectedUser || !origin || destinations.some((dest) => !dest)) {
        throw new Error("Todos los campos son obligatorios")
      }

      // Geocodificar direcciones para calcular distancia
      const originCoords = await geocodeAddress(origin)
      if (!originCoords) {
        throw new Error("No se pudo determinar las coordenadas del origen")
      }

      let totalDistance = 0
      let previousPoint = originCoords

      // Geocodificar cada destino y calcular la distancia total
      for (const destination of destinations) {
        const destCoords = await geocodeAddress(destination)
        if (!destCoords) {
          throw new Error(`No se pudo determinar las coordenadas del destino: ${destination}`)
        }

        // Calcular distancia entre puntos
        const segmentDistance = calculateDistance(previousPoint, destCoords)
        totalDistance += segmentDistance

        // El punto actual se convierte en el punto anterior para el siguiente segmento
        previousPoint = destCoords
      }

      // Calcular precio basado en la distancia y la configuración
      const priceValue = totalDistance * appConfig.getPricePerKm()

      // Crear nuevo viaje asignado según el formato detectado (snake_case o camelCase)
      const newTrip = {
        id: Date.now(),
        user_id: selectedUser, // user_id es común en ambos formatos
        // Usar el formato correcto según lo detectado
        ...(isSnakeCase
          ? {
              origin_address: origin,
              destination_address: destinations.length === 1 ? destinations[0] : JSON.stringify(destinations),
            }
          : {
              originAddress: origin,
              destinationAddress: destinations.length === 1 ? destinations[0] : JSON.stringify(destinations),
            }),
        distance: totalDistance * 1000, // Convertir a metros para mantener consistencia
        price: priceValue,
        status: "pending", // pending, in_progress, completed, cancelled
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Inserting new trip with format:", isSnakeCase ? "snake_case" : "camelCase", newTrip)

      if (isDemoMode) {
        // En modo demo, guardar en localStorage
        const currentTrips = localStorage.getItem("assignedTrips")
          ? JSON.parse(localStorage.getItem("assignedTrips"))
          : []

        const updatedTrips = [newTrip, ...currentTrips]
        localStorage.setItem("assignedTrips", JSON.stringify(updatedTrips))

        setAssignedTrips(updatedTrips)
        setFilteredTrips(updatedTrips)
      } else {
        // En modo real, guardar en Supabase
        const { data, error } = await supabase.from("assigned_trips").insert(newTrip).select()

        if (error) throw error

        // Actualizar la lista de viajes asignados
        const updatedTrips = [data[0], ...assignedTrips]
        setAssignedTrips(updatedTrips)
        setFilteredTrips(updatedTrips)
      }

      // Limpiar formulario
      setSelectedUser("")
      setOrigin("")
      setDestinations([""])
      setSuccess("Viaje asignado correctamente")
    } catch (error) {
      console.error("Error al asignar viaje:", error)
      setError(error.message || "Error al asignar viaje. Por favor, intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirmar eliminación de viaje
  const confirmDeleteTrip = (trip) => {
    setTripToDelete(trip)
    setIsDeleteDialogOpen(true)
  }

  // Eliminar viaje
  const deleteTrip = async () => {
    if (!tripToDelete) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isDemoMode) {
        // En modo demo, eliminar de localStorage
        const currentTrips = localStorage.getItem("assignedTrips")
          ? JSON.parse(localStorage.getItem("assignedTrips"))
          : []

        const updatedTrips = currentTrips.filter((trip) => trip.id !== tripToDelete.id)
        localStorage.setItem("assignedTrips", JSON.stringify(updatedTrips))

        setAssignedTrips(updatedTrips)
        setFilteredTrips(updatedTrips)
      } else {
        // En modo real, eliminar de Supabase
        const { error } = await supabase.from("assigned_trips").delete().eq("id", tripToDelete.id)

        if (error) throw error

        // Actualizar la lista de viajes asignados
        const updatedTrips = assignedTrips.filter((trip) => trip.id !== tripToDelete.id)
        setAssignedTrips(updatedTrips)
        setFilteredTrips(updatedTrips)
      }

      setSuccess("Viaje eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar viaje:", error)
      setError(error.message || "Error al eliminar viaje. Por favor, intente nuevamente.")
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      setTripToDelete(null)
    }
  }

  // Filtrar usuarios para el selector de cadetes
  const filteredUsers = users.filter((user) => {
    if (!userSearchValue) return true

    const fullName = `${user.name} ${user.last_name} ${user.cadete_id}`.toLowerCase()
    return fullName.includes(userSearchValue.toLowerCase())
  })

  // Helper function to get destination addresses from trip
  const getDestinationAddresses = (trip) => {
    // Check for destination_address as JSON string
    if (trip.destination_address && typeof trip.destination_address === "string") {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(trip.destination_address)
        if (Array.isArray(parsed)) {
          return parsed
        }
        // If it's not an array, return as single item
        return [trip.destination_address]
      } catch (e) {
        // If not valid JSON, treat as single address
        return [trip.destination_address]
      }
    }

    // Check for camelCase version
    if (trip.destinationAddress && typeof trip.destinationAddress === "string") {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(trip.destinationAddress)
        if (Array.isArray(parsed)) {
          return parsed
        }
        // If it's not an array, return as single item
        return [trip.destinationAddress]
      } catch (e) {
        // If not valid JSON, treat as single address
        return [trip.destinationAddress]
      }
    }

    // Check other possible formats
    if (trip.destination_addresses && Array.isArray(trip.destination_addresses)) {
      return trip.destination_addresses
    }
    if (trip.destinationAddresses && Array.isArray(trip.destinationAddresses)) {
      return trip.destinationAddresses
    }
    if (trip.destinations && Array.isArray(trip.destinations)) {
      return trip.destinations.map((dest) => dest.address)
    }

    return ["Destino desconocido"]
  }

  // Helper function to get origin address
  const getOriginAddress = (trip) => {
    return trip.origin_address || trip.originAddress || "Origen desconocido"
  }

  return (
    <div className="space-y-6">
      {/* Formulario para asignar viajes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Asignar Nuevo Viaje</CardTitle>
          <CardDescription>Asigna un viaje a un cadete específico</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="ml-2 text-green-700 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">Cadete</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                      {selectedUser
                        ? users.find((user) => user.user_id === selectedUser)
                          ? `${users.find((user) => user.user_id === selectedUser).name} ${users.find((user) => user.user_id === selectedUser).last_name}`
                          : "Seleccionar cadete"
                        : "Seleccionar cadete"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar cadete..."
                        value={userSearchValue}
                        onValueChange={setUserSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron cadetes.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {filteredUsers.map((user) => (
                            <CommandItem
                              key={user.user_id}
                              value={user.user_id}
                              onSelect={(currentValue) => {
                                setSelectedUser(currentValue === selectedUser ? "" : currentValue)
                                setOpen(false)
                                setUserSearchValue("")
                              }}
                            >
                              <span className={cn("mr-2", selectedUser === user.user_id ? "opacity-100" : "opacity-0")}>
                                ✓
                              </span>
                              {user.name} {user.last_name} ({user.cadete_id})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Dirección de Origen</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: Avenida Sarmiento 230, Gualeguaychú"
                />
              </div>
            </div>

            {/* Destinos múltiples */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Destinos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDestination} className="h-8 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar destino
                </Button>
              </div>

              <div className="space-y-2">
                {destinations.map((dest, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-grow">
                      <Navigation className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        value={dest}
                        onChange={(e) => updateDestination(index, e.target.value)}
                        placeholder={`Destino ${index + 1}`}
                        className="pl-8"
                      />
                    </div>
                    {destinations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDestination(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                La distancia y el precio se calcularán automáticamente según la configuración actual: $
                {appConfig.getPricePerKm()} por km
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Asignar Viaje
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de viajes asignados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Viajes Asignados</CardTitle>
          <CardDescription>Listado de viajes asignados a cadetes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por dirección o cadete..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tabla de viajes asignados */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cadete</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino(s)</TableHead>
                    <TableHead>Distancia</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No se encontraron viajes asignados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(trip.created_at)}</TableCell>
                        <TableCell>{getUserName(trip.user_id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            <span className="truncate max-w-[150px]">{getOriginAddress(trip)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getDestinationAddresses(trip).map((dest, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <Navigation className="h-3 w-3 text-blue-500" />
                                <span className="truncate max-w-[150px]">
                                  {dest}
                                  {idx < getDestinationAddresses(trip).length - 1 && ","}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{(trip.distance / 1000).toFixed(2)} km</TableCell>
                        <TableCell>${trip.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {trip.status === "completed" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completado
                            </Badge>
                          ) : trip.status === "in_progress" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                            >
                              En curso
                            </Badge>
                          ) : trip.status === "cancelled" ? (
                            <Badge
                              variant="outline"
                              className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                            >
                              Cancelado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                            >
                              <Briefcase className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteTrip(trip)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar viaje */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este viaje asignado?
              {tripToDelete && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <div className="mb-1">
                    <span className="font-medium">Cadete:</span> {getUserName(tripToDelete.user_id)}
                  </div>
                  <div className="mb-1">
                    <span className="font-medium">Origen:</span> {getOriginAddress(tripToDelete)}
                  </div>
                  <div className="mb-1">
                    <span className="font-medium">Destino(s):</span> {getDestinationAddresses(tripToDelete).join(", ")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTrip} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

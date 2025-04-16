"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Navigation, CheckCircle, ExternalLink } from "lucide-react"
import { useAuth } from "@/context/auth-context"
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

export default function AssignedTrips({ onShowInMap, onUpdatePendingCount }) {
  const { user, isDemoMode } = useAuth()
  const [assignedTrips, setAssignedTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [tripToComplete, setTripToComplete] = useState(null)

  const showTripInMap = (trip) => {
    if (onShowInMap) {
      onShowInMap(trip)
    }
  }

  useEffect(() => {
    const fetchAssignedTrips = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        let tripsData = []

        if (isDemoMode) {
          const allTrips = localStorage.getItem("assignedTrips")
            ? JSON.parse(localStorage.getItem("assignedTrips"))
            : []
          tripsData = allTrips.filter((trip) => trip.user_id === user.id)
        } else {
          const { data, error } = await supabase
            .from("assigned_trips")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (error) throw error
          tripsData = data || []
        }

        setAssignedTrips(tripsData)

        if (onUpdatePendingCount) {
          const pendingTrips = tripsData.filter((trip) => trip.status !== "completed" && trip.status !== "cancelled")
          onUpdatePendingCount(pendingTrips.length)
        }
      } catch (error) {
        console.error("Error al cargar viajes asignados:", error)
        setError("Error al cargar viajes asignados. Por favor, intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignedTrips()
  }, [user, isDemoMode, onUpdatePendingCount])

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

  const handleNavigateToTrip = (trip) => {
    const originAddress = (trip.origin_address || trip.originAddress || "").includes("Gualeguaychú")
      ? trip.origin_address || trip.originAddress
      : `${trip.origin_address || trip.originAddress}, Gualeguaychú`

    let waypoints = ""
    const destinations = getDestinationAddresses(trip)

    if (destinations.length > 1) {
      const intermediateDestinations = destinations.slice(0, -1)
      waypoints = intermediateDestinations
        .map((dest) => {
          const address = dest.includes("Gualeguaychú") ? dest : `${dest}, Gualeguaychú`
          return encodeURIComponent(address)
        })
        .join("|")
    } else if (destinations.length === 1) {
      waypoints = encodeURIComponent(originAddress)
    } else {
      waypoints = encodeURIComponent(originAddress)
    }

    const finalDestination = destinations.length > 0 ? destinations[destinations.length - 1] : ""
    const destinationAddress = finalDestination.includes("Gualeguaychú")
      ? finalDestination
      : `${finalDestination}, Gualeguaychú`
    const destinationEncoded = encodeURIComponent(destinationAddress)

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destinationEncoded}&waypoints=${waypoints}&travelmode=driving`

    window.open(googleMapsUrl, "_blank")
  }

  const confirmCompleteTrip = (trip) => {
    setTripToComplete(trip)
    setIsCompleteDialogOpen(true)
  }

  const completeTrip = async () => {
    if (!tripToComplete) return

    setIsLoading(true)
    try {
      if (isDemoMode) {
        const allTrips = localStorage.getItem("assignedTrips") ? JSON.parse(localStorage.getItem("assignedTrips")) : []

        const updatedTrips = allTrips.map((trip) =>
          trip.id === tripToComplete.id ? { ...trip, status: "completed", updated_at: new Date().toISOString() } : trip,
        )

        localStorage.setItem("assignedTrips", JSON.stringify(updatedTrips))
        setAssignedTrips(updatedTrips)
      } else {
        const { error } = await supabase
          .from("assigned_trips")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", tripToComplete.id)

        if (error) throw error

        setAssignedTrips((prevTrips) =>
          prevTrips.map((trip) =>
            trip.id === tripToComplete.id
              ? { ...trip, status: "completed", updated_at: new Date().toISOString() }
              : trip,
          ),
        )

        if (onUpdatePendingCount) {
          const pendingTrips = assignedTrips.filter(
            (trip) => trip.id !== tripToComplete.id && trip.status !== "completed" && trip.status !== "cancelled",
          )
          onUpdatePendingCount(pendingTrips.length)
        }
      }
    } catch (error) {
      console.error("Error al completar viaje:", error)
      setError("Error al completar viaje. Por favor, intente nuevamente.")
    } finally {
      setIsLoading(false)
      setIsCompleteDialogOpen(false)
      setTripToComplete(null)
    }
  }

  if (!isLoading && assignedTrips.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          Viajes Asignados
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Viajes que te han sido asignados por el administrador
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {assignedTrips.map((trip) => (
              <Card
                key={trip.id}
                className="overflow-hidden shadow-sm border-blue-100 dark:border-gray-700 dark:bg-gray-800"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                      <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">Origen:</div>
                      <div className="text-xs sm:text-sm">
                        {trip.origin_address || trip.originAddress || "Origen desconocido"}
                      </div>
                    </div>

                    {getDestinationAddresses(trip).map((dest, idx) => (
                      <div key={idx} className="flex items-center gap-1 sm:gap-2">
                        <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                        <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                          Destino {getDestinationAddresses(trip).length > 1 ? idx + 1 : ""}:
                        </div>
                        <div className="text-xs sm:text-sm">{dest}</div>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-blue-700 dark:text-blue-300">Distancia:</span>
                        <span>{(trip.distance / 1000).toFixed(2)} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-blue-700 dark:text-blue-300">Precio:</span>
                        <span>${trip.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-2 sm:my-3 bg-blue-100 dark:bg-gray-600" />
                  <div className="flex justify-between items-center">
                    {trip.status === "completed" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    ) : trip.status === "cancelled" ? (
                      <Badge
                        variant="outline"
                        className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                      >
                        Cancelado
                      </Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNavigateToTrip(trip)}
                          title="Navegar a este viaje"
                          className="h-7 sm:h-8 text-xs sm:text-sm border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Navegar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showTripInMap(trip)}
                          title="Ver en mapa"
                          className="h-7 sm:h-8 text-xs sm:text-sm border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Ver en mapa
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => confirmCompleteTrip(trip)}
                          title="Marcar viaje como completado"
                          className="h-7 sm:h-8 text-xs sm:text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 border-green-300 dark:border-green-700"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Completar
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(trip.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diálogo de confirmación para completar viaje */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent className="z-[2000] max-w-[90%] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              Confirmar viaje completado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              ¿Estás seguro de que deseas marcar este viaje como completado?
              {tripToComplete && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <div className="mb-1">
                    <span className="font-medium">Origen:</span>{" "}
                    {tripToComplete.origin_address || tripToComplete.originAddress}
                  </div>
                  {getDestinationAddresses(tripToComplete).map((dest, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-medium">
                        Destino {getDestinationAddresses(tripToComplete).length > 1 ? idx + 1 : ""}:
                      </span>{" "}
                      {dest}
                    </div>
                  ))}
                  <div>
                    <span className="font-medium">Distancia:</span> {(tripToComplete.distance / 1000).toFixed(2)} km
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs sm:text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={completeTrip} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

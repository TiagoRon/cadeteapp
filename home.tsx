"use client"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import {
  AlertDialog,
  AlertDialogContent as AlertDialogContentComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogAction as AlertDialogActionComponent,
  AlertDialogCancel as AlertDialogCancelComponent,
} from "@/components/ui/alert-dialog"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  MapPin,
  Navigation,
  PlusCircle,
  AlertCircle,
  Plus,
  X,
  LogOut,
  Users,
  ExternalLink,
  CheckCircle,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "./components/theme-toggle"
import AssignedTrips from "./components/assigned-trips"

// Al principio del archivo, añadir:
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

// Importa la configuración global al principio del archivo
import { appConfig } from "@/lib/config"

// Update the import for the map component
import MapClient from "./map-client"

// Importación dinámica de Leaflet para evitar problemas de SSR
// const MapComponent = dynamic(() => import("./map-component"), {
//   ssr: false,
//   loading: () => (
//     <div className="h-[400px] md:h-[500px] w-full flex items-center justify-center bg-slate-100 dark:bg-gray-800 rounded-lg">
//       <div className="text-center">
//         <MapIcon className="h-10 w-10 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
//         <p className="text-slate-500 dark:text-slate-400">Cargando mapa...</p>
//       </div>
//     </div>
//   ),
// })

export default function Home() {
  // Dentro del componente Home, añadir:
  const { profile, signOut, isDemoMode, isAdmin } = useAuth()
  const router = useRouter()

  // Referencia para almacenar la instancia de Leaflet cuando se cargue dinámicamente
  const L = useRef(null)

  // Primero, añadir un nuevo estado para el modo de múltiples destinos
  const [multiDestinationMode, setMultiDestinationMode] = useState(false)

  // Añadir un estado para almacenar los destinos múltiples
  const [multiDestinations, setMultiDestinations] = useState([])

  // Añadir una referencia para el modo de múltiples destinos
  const multiDestinationModeRef = useRef(false)

  // Actualizar la referencia cuando cambia el estado
  useEffect(() => {
    multiDestinationModeRef.current = multiDestinationMode
  }, [multiDestinationMode])

  // Estados para gestionar viajes, historial y el mapa
  const [trips, setTrips] = useState([])
  const [history, setHistory] = useState([])
  const [currentTrip, setCurrentTrip] = useState(null)
  const [map, setMap] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  // Añadir un nuevo estado para controlar los viajes asignados que se muestran en el mapa
  // Añadir después de la declaración de los otros estados:

  // Estado para viajes asignados en el mapa
  const [assignedTripOnMap, setAssignedTripOnMap] = useState(null)

  // Contador de viajes asignados pendientes
  const [pendingAssignedTripsCount, setPendingAssignedTripsCount] = useState(0)

  // Estado para el diálogo de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [markerToDelete, setMarkerToDelete] = useState(null)

  // Añadir un nuevo estado para el diálogo de confirmación de completar viaje
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [tripToComplete, setTripToComplete] = useState(null)

  const currentTripRef = useRef(null)
  const clickProcessingRef = useRef(false)
  const deleteProcessingRef = useRef(false)

  // Íconos para los marcadores de origen y destino
  const [originIcon, setOriginIcon] = useState(null)
  const [destinationIcon, setDestinationIcon] = useState(null)

  // Cargar Leaflet dinámicamente
  // useEffect(() => {
  //   const loadLeaflet = async () => {
  //     try {
  //       const leaflet = await import("leaflet")
  //       L.current = leaflet.default || leaflet

  //       // Inicializar los íconos una vez que Leaflet esté cargado
  //       setOriginIcon(
  //         L.current.icon({
  //           iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png", // Marcador rojo para origen
  //           iconSize: [36, 36],
  //           iconAnchor: [18, 36],
  //           popupAnchor: [0, -36],
  //         }),
  //       )

  //       setDestinationIcon(
  //         L.current.icon({
  //           iconUrl: "https://img.icons8.com/color/48/ff0000/marker.png", // Marcador azul para destino
  //           iconSize: [36, 36],
  //           iconAnchor: [18, 36],
  //           popupAnchor: [0, -36],
  //         }),
  //       )
  //     } catch (error) {
  //       console.error("Error al cargar Leaflet:", error)
  //     }
  //   }

  //   loadLeaflet()
  // }, [])

  useEffect(() => {
    currentTripRef.current = currentTrip
  }, [currentTrip])

  // Estados para la búsqueda manual y errores
  const [manualOriginQuery, setManualOriginQuery] = useState("")
  const [manualDestinationQueries, setManualDestinationQueries] = useState([""])
  const [manualError, setManualError] = useState("")

  // Estados para las sugerencias en cada input
  const [originSuggestions, setOriginSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(0)

  // Arreglo predefinido de calles (solo se define el nombre de la calle)
  const manualStreetSuggestions = [
    "Avenida Sarmiento",
    "Calle Colón",
    "Avenida 9 de Julio",
    "Calle Rivadavia",
    "Avenida Mitre",
    "Luis N Palma",
  ]

  // Arreglo predefinido de alturas (en cadena)
  const manualHouseSuggestions = ["230", "240", "250", "260", "270"]

  // Umbral para evitar viajes demasiado cortos (aproximadamente 50 metros)
  const CLICK_THRESHOLD_KM = 0.05

  // Arreglo de colores para las rutas y ref para su iteración
  const routeColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#a16207", "#ec4899", "#14b8a6"]
  const colorIndexRef = useRef(0)

  // Íconos para los marcadores de origen y destino (mismo icono, diferentes colores)
  // const originIcon = typeof L !== 'undefined' ? L.icon({
  //   iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png", // Marcador rojo para origen
  //   iconSize: [36, 36],
  //   iconAnchor: [18, 36],
  //   popupAnchor: [0, -36],
  // }) : null

  // const destinationIcon = typeof L !== 'undefined' ? L.icon({
  //   iconUrl: "https://img.icons8.com/color/48/ff0000/marker.png", // Marcador azul para destino (misma forma)
  //   iconSize: [36, 36],
  //   iconAnchor: [18, 36],
  //   popupAnchor: [0, -36],
  // }) : null

  // Función para formatear la dirección restringida: solo se muestra "calle, número"
  const formatAddress = (data) => {
    if (!data.address) return data.display_name
    const street = data.address.road || data.address.pedestrian || data.address.cycleway || ""
    const house = data.address.house_number || ""
    return street + (house ? `, ${house}` : "")
  }

  // Función de geocodificación inversa: devuelve "calle, número"
  const getAddress = async (lat, lng) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Se extrae solo la calle y el número (si existen)
      if (data.address) {
        const street = data.address.road || data.address.pedestrian || data.address.cycleway || ""
        const house = data.address.house_number || ""
        return street + (house ? `, ${house}` : "") + ", Gualeguaychú" // Añadimos Gualeguaychú
      }
      return data.display_name + ", Gualeguaychú" // Añadimos Gualeguaychú
    } catch (error) {
      console.error("Error en getAddress:", error)
      return "Dirección desconocida, Gualeguaychú" // Valor por defecto con Gualeguaychú
    }
  }

  // Viewbox para limitar la búsqueda a Gualeguaychú
  const GUALEGUAYCHU_VIEWBOX = "-58.6471,-32.8741,-58.3471,-33.1741"

  // Función de sugerencias para el input de origen
  const handleOriginInputChange = (e) => {
    const query = e.target.value
    setManualOriginQuery(query)
    if (query.trim().length === 0) {
      setOriginSuggestions([])
      return
    }
    const match = query.match(/^(.+?)(\d*)$/)
    const streetPart = match ? match[1].trim() : query
    const numberPart = match ? match[2] : ""

    const filteredStreets = manualStreetSuggestions.filter((street) =>
      street.toLowerCase().includes(streetPart.toLowerCase()),
    )
    let suggestions = []
    if (numberPart.length > 0) {
      filteredStreets.forEach((street) => {
        const houseMatches = manualHouseSuggestions.filter((house) => house.startsWith(numberPart))
        if (houseMatches.length > 0) {
          houseMatches.forEach((house) => {
            suggestions.push(`${street} ${house}`)
          })
        } else {
          suggestions.push(`${street} ${numberPart}`)
        }
      })
    } else {
      suggestions = filteredStreets
    }
    setOriginSuggestions(suggestions)
  }

  // Función de sugerencias para el input de destino
  const handleDestinationInputChange = (e, index) => {
    const query = e.target.value
    const newDestinations = [...manualDestinationQueries]
    newDestinations[index] = query
    setManualDestinationQueries(newDestinations)
    setActiveDestinationIndex(index)

    if (query.trim().length === 0) {
      setDestinationSuggestions([])
      return
    }

    const match = query.match(/^(.+?)(\d*)$/)
    const streetPart = match ? match[1].trim() : query
    const numberPart = match ? match[2] : ""

    const filteredStreets = manualStreetSuggestions.filter((street) =>
      street.toLowerCase().includes(streetPart.toLowerCase()),
    )
    let suggestions = []
    if (numberPart.length > 0) {
      filteredStreets.forEach((street) => {
        const houseMatches = manualHouseSuggestions.filter((house) => house.startsWith(numberPart))
        if (houseMatches.length > 0) {
          houseMatches.forEach((house) => {
            suggestions.push(`${street} ${house}`)
          })
        } else {
          suggestions.push(`${street} ${numberPart}`)
        }
      })
    } else {
      suggestions = filteredStreets
    }
    setDestinationSuggestions(suggestions)
  }

  // Seleccionar sugerencia para el origen
  const handleSelectOriginSuggestion = (suggestion) => {
    setManualOriginQuery(suggestion)
    setOriginSuggestions([])
  }

  // Seleccionar sugerencia para el destino
  const handleSelectDestinationSuggestion = (suggestion) => {
    const newDestinations = [...manualDestinationQueries]
    newDestinations[activeDestinationIndex] = suggestion
    setManualDestinationQueries(newDestinations)
    setDestinationSuggestions([])
  }

  // Función para añadir un nuevo destino
  const addDestination = () => {
    setManualDestinationQueries([...manualDestinationQueries, ""])
  }

  // Función para eliminar un destino
  const removeDestination = (index) => {
    if (manualDestinationQueries.length <= 1) return
    const newDestinations = [...manualDestinationQueries]
    newDestinations.splice(index, 1)
    setManualDestinationQueries(newDestinations)
  }

  // Función para calcular distancia (km) entre dos puntos (por sus coordenadas)
  const getDistance = (pointA, pointB) => {
    if (!pointA || !pointB) return 0
    const R = 6371
    const toRad = (value) => (value * Math.PI) / 180
    const dLat = toRad(pointB.lat - pointA.lat)
    const dLon = toRad(pointB.lng - pointA.lng)
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(pointA.lat)) * Math.cos(toRad(pointB.lat)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Función para confirmar la eliminación de un marcador
  const confirmDeleteMarker = (marker, isOrigin) => {
    // Evitar múltiples clics
    if (deleteProcessingRef.current) return
    deleteProcessingRef.current = true

    // Cerrar cualquier popup abierto
    if (marker && marker.closePopup) {
      marker.closePopup()
    }

    // Establecer el marcador a eliminar y mostrar el diálogo
    setMarkerToDelete({ marker, isOrigin })
    setIsDeleteDialogOpen(true)

    // Restablecer el flag después de un breve retraso
    setTimeout(() => {
      deleteProcessingRef.current = false
    }, 500)
  }

  // Reemplazar la función handleDeleteMarker con esta nueva versión que recalcula las rutas
  // cuando se elimina un punto intermedio en un viaje con múltiples destinos
  const handleDeleteMarker = async () => {
    if (!markerToDelete || !map || !L.current) {
      setIsDeleteDialogOpen(false)
      setMarkerToDelete(null)
      return
    }

    const { marker, isOrigin } = markerToDelete

    try {
      // Si es un viaje en curso (currentTrip)
      if (currentTripRef.current) {
        // Si es el origen, cancelamos todo el viaje
        if (isOrigin) {
          // Eliminar todos los marcadores y rutas del mapa
          currentTripRef.current.markers.forEach((m) => {
            map.removeLayer(m)
          })

          if (currentTripRef.current.routes) {
            currentTripRef.current.routes.forEach((route) => {
              if (route) map.removeLayer(route)
            })
          } else if (currentTripRef.current.route) {
            map.removeLayer(currentTripRef.current.route)
          }

          // Reiniciar el viaje actual
          setCurrentTrip(null)
          currentTripRef.current = null
          setMultiDestinations([])
        }
        // Si es un destino en modo múltiples destinos
        else if (multiDestinationMode && currentTripRef.current.destinations) {
          // Encontrar el índice del marcador en el array de marcadores
          const markerIndex = currentTripRef.current.markers.findIndex((m) => m === marker)

          // Si es el primer marcador (origen), no hacemos nada (ya manejado arriba)
          if (markerIndex <= 0) return

          // Eliminar el marcador del mapa
          map.removeLayer(marker)

          // Crear una copia del viaje actual para modificarlo
          const updatedTrip = { ...currentTripRef.current }

          // Eliminar el marcador del array de marcadores
          updatedTrip.markers.splice(markerIndex, 1)

          // El índice del destino es markerIndex - 1 (porque el primer marcador es el origen)
          const destinationIndex = markerIndex - 1

          // Eliminar la ruta asociada si existe
          if (updatedTrip.routes && updatedTrip.routes[destinationIndex]) {
            map.removeLayer(updatedTrip.routes[destinationIndex])
            updatedTrip.routes.splice(destinationIndex, 1)
          }

          // Actualizar la distancia total restando la distancia de este tramo
          if (updatedTrip.roadDistances && updatedTrip.roadDistances[destinationIndex]) {
            updatedTrip.totalDistance -= updatedTrip.roadDistances[destinationIndex]
            updatedTrip.roadDistances.splice(destinationIndex, 1)
          }

          // Eliminar el destino del array de destinos
          const newDestinations = [...multiDestinations]
          newDestinations.splice(destinationIndex, 1)
          updatedTrip.destinations = newDestinations

          // Si eliminamos un punto intermedio (no el último), necesitamos recalcular la ruta
          // entre el punto anterior y el siguiente punto
          if (destinationIndex > 0 && destinationIndex < newDestinations.length) {
            // Punto anterior
            const prevPoint = destinationIndex === 0 ? updatedTrip.origin : newDestinations[destinationIndex - 1].coord

            // Punto siguiente
            const nextPoint = newDestinations[destinationIndex].coord

            // Eliminar la ruta anterior si existe
            if (updatedTrip.routes && updatedTrip.routes[destinationIndex]) {
              map.removeLayer(updatedTrip.routes[destinationIndex])
              updatedTrip.routes[destinationIndex] = null
            }

            try {
              // Calcular nueva ruta entre el punto anterior y el siguiente
              const url = `https://router.project-osrm.org/route/v1/driving/${prevPoint.lng},${prevPoint.lat};${nextPoint.lng},${nextPoint.lat}?overview=full&geometries=geojson`

              const response = await fetch(url)
              const data = await response.json()

              if (data.routes && data.routes.length > 0) {
                const roadDistance = data.routes[0].distance

                // Actualizar la distancia
                if (updatedTrip.roadDistances) {
                  updatedTrip.roadDistances[destinationIndex] = roadDistance

                  // Recalcular la distancia total
                  updatedTrip.totalDistance = updatedTrip.roadDistances.reduce((sum, dist) => sum + dist, 0)
                }

                const routeGeo = data.routes[0].geometry
                const latlngs = routeGeo.coordinates.map((coord) => [coord[1], coord[0]])

                // Crear nueva ruta con el mismo color
                const routeLine = L.current.polyline(latlngs, { color: updatedTrip.color }).addTo(map)
                updatedTrip.routes[destinationIndex] = routeLine
              }
            } catch (error) {
              console.error("Error al recalcular la ruta:", error)
            }
          }

          // Recalcular el precio
          updatedTrip.price = (updatedTrip.totalDistance / 1000) * appConfig.getPricePerKm()

          // Actualizar el estado
          setMultiDestinations(newDestinations)
          setCurrentTrip(updatedTrip)
          currentTripRef.current = updatedTrip
        }
      }
      // Si es un viaje ya creado, lo eliminamos completamente
      else {
        // Buscar el viaje que contiene este marcador
        const tripWithMarker = trips.find((trip) => trip.markers && trip.markers.some((m) => m === marker))

        if (tripWithMarker) {
          deleteTrip(tripWithMarker.id)
        } else if (marker && map) {
          // Si no encontramos el viaje pero tenemos el marcador, lo eliminamos
          map.removeLayer(marker)
        }
      }
    } catch (error) {
      console.error("Error al eliminar marcador:", error)
    } finally {
      // Siempre cerrar el diálogo y limpiar el estado
      setIsDeleteDialogOpen(false)
      setMarkerToDelete(null)
    }
  }

  // Nueva función para abrir Google Maps con ruta completa: ubicación actual -> origen -> destinos
  const handleNavigateToTrip = (trip) => {
    // Asegurarnos de que las direcciones incluyan "Gualeguaychú"
    const originAddress = trip.originAddress.includes("Gualeguaychú")
      ? trip.originAddress
      : `${trip.originAddress}, Gualeguaychú`

    // Crear waypoints con todos los destinos intermedios
    let waypoints = ""
    if (trip.destinations && trip.destinations.length > 1) {
      // Si hay múltiples destinos, todos excepto el último son waypoints
      const intermediateDestinations = trip.destinations.slice(0, -1)
      waypoints = intermediateDestinations
        .map((dest) => {
          const address = dest.address.includes("Gualeguaychú") ? dest.address : `${dest.address}, Gualeguaychú`
          return encodeURIComponent(address)
        })
        .join("|")
    } else {
      // Si solo hay un destino o es el formato antiguo, el origen es el waypoint
      waypoints = encodeURIComponent(originAddress)
    }

    // El destino final es el último destino
    const finalDestination =
      trip.destinations && trip.destinations.length > 0
        ? trip.destinations[trip.destinations.length - 1]
        : { address: trip.destinationAddress }

    const destinationAddress = finalDestination.address.includes("Gualeguaychú")
      ? finalDestination.address
      : `${finalDestination.address}, Gualeguaychú`

    const destinationEncoded = encodeURIComponent(destinationAddress)

    // Crear URL para Google Maps con waypoints
    // Formato: origen (ubicación actual) -> destino final con paradas en los waypoints
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destinationEncoded}&waypoints=${waypoints}&travelmode=driving`

    window.open(googleMapsUrl, "_blank")
  }

  // Función para reiniciar todos los viajes (activos e historial)
  const resetTrips = () => {
    if (map && L.current) {
      // Eliminar todos los marcadores y rutas del mapa
      map.eachLayer((layer) => {
        if (layer instanceof L.current.Marker || layer instanceof L.current.Polyline) {
          map.removeLayer(layer)
        }
      })
    }
    setTrips([])
    setHistory([])
    setCurrentTrip(null)
    currentTripRef.current = null
  }

  // Reemplazar la función handleCompleteTrip con esta nueva versión
  const confirmCompleteTrip = (tripId) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return

    setTripToComplete(trip)
    setIsCompleteDialogOpen(true)
  }

  // Añadir esta nueva función para manejar la confirmación
  const handleCompleteTrip = () => {
    if (!tripToComplete || !map) {
      setIsCompleteDialogOpen(false)
      setTripToComplete(null)
      return
    }

    // Eliminar marcadores y rutas del mapa antes de mover al historial
    tripToComplete.markers.forEach((marker) => {
      map.removeLayer(marker)
    })
    if (tripToComplete.routes) {
      tripToComplete.routes.forEach((route) => {
        if (route) map.removeLayer(route)
      })
    } else if (tripToComplete.route) {
      map.removeLayer(tripToComplete.route)
    }

    setTrips((prev) => prev.filter((trip) => trip.id !== tripToComplete.id))
    tripToComplete.completed = true
    setHistory((prev) => [...prev, tripToComplete])

    setIsCompleteDialogOpen(false)
    setTripToComplete(null)
  }

  // Modificar la función deleteTrip para que solo funcione con viajes activos, no con historial
  const deleteTrip = (tripId) => {
    const tripToDelete = trips.find((trip) => trip.id === tripId)
    if (tripToDelete && map) {
      tripToDelete.markers.forEach((marker) => {
        map.removeLayer(marker)
      })
      if (tripToDelete.routes) {
        tripToDelete.routes.forEach((route) => {
          if (route) map.removeLayer(route)
        })
      } else if (tripToDelete.route) {
        map.removeLayer(tripToDelete.route)
      }
    }
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }

  // Añadir esta función para limpiar el historial al final del día
  useEffect(() => {
    // Verificar si es un nuevo día y limpiar el historial
    const checkAndClearHistory = () => {
      const now = new Date()
      const currentDay = now.getDate()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Obtener la última fecha guardada o establecer la actual
      const lastCleanupStr = localStorage.getItem("lastHistoryCleanup")
      if (!lastCleanupStr) {
        localStorage.setItem(
          "lastHistoryCleanup",
          JSON.stringify({
            day: currentDay,
            month: currentMonth,
            year: currentYear,
          }),
        )
        return
      }

      const lastCleanup = JSON.parse(lastCleanupStr)

      // Si es un nuevo día, limpiar el historial
      if (lastCleanup.day !== currentDay || lastCleanup.month !== currentMonth || lastCleanup.year !== currentYear) {
        setHistory([])
        localStorage.setItem(
          "lastHistoryCleanup",
          JSON.stringify({
            day: currentDay,
            month: currentMonth,
            year: currentYear,
          }),
        )
      }
    }

    checkAndClearHistory()

    // Configurar un intervalo para verificar cada hora
    const interval = setInterval(checkAndClearHistory, 3600000) // 1 hora

    return () => clearInterval(interval)
  }, [])

  // Modificar la función handleMapClick para soportar múltiples destinos
  // Reemplazar la función handleMapClick existente con esta nueva versión:

  // Lógica para capturar clics en el mapa y marcar la ubicación
  useEffect(() => {
    if (map && L.current && originIcon && destinationIcon) {
      const handleMapClick = async (e) => {
        if (clickProcessingRef.current) return
        clickProcessingRef.current = true
        try {
          // Si estamos en modo de múltiples destinos
          if (multiDestinationModeRef.current) {
            // Si no existe un viaje en curso, interpretamos el clic como el origen
            if (!currentTripRef.current) {
              console.log("Creando nuevo viaje con múltiples destinos - origen")
              // Obtenemos la dirección del clic (geocodificación inversa)
              let originAddress
              try {
                originAddress = await getAddress(e.latlng.lat, e.latlng.lng)
                console.log("Dirección de origen obtenida:", originAddress)
              } catch (error) {
                console.error("Error al obtener dirección de origen:", error)
                originAddress = "Dirección desconocida, Gualeguaychú"
              }

              // Seleccionar un color para todo el viaje
              const selectedColor = routeColors[colorIndexRef.current]
              colorIndexRef.current = (colorIndexRef.current + 1) % routeColors.length

              // Creamos un nuevo objeto viaje con la información del origen
              const newTrip = {
                id: Date.now(),
                origin: e.latlng,
                originAddress,
                destinations: [],
                markers: [],
                routes: [],
                roadDistances: [],
                totalDistance: 0,
                price: null,
                completed: false,
                color: selectedColor, // Usar un solo color para todo el viaje
              }

              // Agregamos un marcador en el mapa para el origen con evento de clic
              const originMarker = L.current
                .marker(e.latlng, { icon: originIcon })
                .addTo(map)
                .bindPopup("Origen: " + originAddress)
                .openPopup()

              // Añadir evento de clic al marcador para eliminarlo
              originMarker.on("click", (event) => {
                // Detener la propagación para evitar que el evento llegue al mapa
                L.current.DomEvent.stopPropagation(event)
                confirmDeleteMarker(originMarker, true)
              })

              newTrip.markers.push(originMarker)
              setCurrentTrip(newTrip)
              currentTripRef.current = newTrip
              setMultiDestinations([])
              console.log("Viaje con múltiples destinos iniciado:", newTrip)
            } else {
              // Si ya tenemos un origen, añadimos un nuevo destino
              console.log("Añadiendo destino al viaje con múltiples destinos")

              // Calculamos la distancia entre el último punto y el nuevo clic para evitar errores por clics muy cercanos
              const lastPoint =
                multiDestinations.length > 0
                  ? multiDestinations[multiDestinations.length - 1].coord
                  : currentTripRef.current.origin

              const distanceFromLastPoint = getDistance(lastPoint, e.latlng)

              if (distanceFromLastPoint < CLICK_THRESHOLD_KM) {
                console.log("Clic muy cercano al punto anterior, ignorado.")
                clickProcessingRef.current = false
                return
              }

              // Obtenemos la dirección del destino a partir del clic
              let destinationAddress
              try {
                destinationAddress = await getAddress(e.latlng.lat, e.latlng.lng)
                console.log("Dirección de destino obtenida:", destinationAddress)
              } catch (error) {
                console.error("Error al obtener dirección de destino:", error)
                destinationAddress = "Dirección desconocida, Gualeguaychú"
              }

              // Crear un nuevo destino
              const newDestination = {
                coord: e.latlng,
                address: destinationAddress,
              }

              // Colocamos un marcador para el destino con evento de clic
              const destinationMarker = L.current
                .marker(e.latlng, { icon: destinationIcon })
                .addTo(map)
                .bindPopup(`Destino ${multiDestinations.length + 1}: ${destinationAddress}`)
                .openPopup()

              // Añadir evento de clic al marcador para eliminarlo
              destinationMarker.on("click", (event) => {
                // Detener la propagación para evitar que el evento llegue al mapa
                L.current.DomEvent.stopPropagation(event)
                confirmDeleteMarker(destinationMarker, false)
              })

              // Actualizar el viaje actual con el nuevo destino
              const updatedTrip = { ...currentTripRef.current }
              updatedTrip.markers.push(destinationMarker)
              updatedTrip.destinations = [...multiDestinations, newDestination]

              // Calcular la ruta entre el último punto y el nuevo destino
              try {
                console.log("Calculando ruta")
                const startPoint =
                  multiDestinations.length > 0
                    ? multiDestinations[multiDestinations.length - 1].coord
                    : updatedTrip.origin

                const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${e.latlng.lng},${e.latlng.lat}?overview=full&geometries=geojson`

                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

                const response = await fetch(url, { signal: controller.signal })
                clearTimeout(timeoutId)

                if (!response.ok) {
                  throw new Error(`Error HTTP: ${response.status}`)
                }

                const data = await response.json()

                if (data.routes && data.routes.length > 0) {
                  const roadDistance = data.routes[0].distance
                  updatedTrip.roadDistances.push(roadDistance)
                  updatedTrip.totalDistance = (updatedTrip.totalDistance || 0) + roadDistance

                  const routeGeo = data.routes[0].geometry
                  const latlngs = routeGeo.coordinates.map((coord) => [coord[1], coord[0]])

                  // Usar el mismo color para todas las rutas
                  console.log("Añadiendo ruta al mapa")
                  const routeLine = L.current.polyline(latlngs, { color: updatedTrip.color }).addTo(map)
                  updatedTrip.routes.push(routeLine)
                  updatedTrip.price = (updatedTrip.totalDistance / 1000) * appConfig.getPricePerKm()
                } else {
                  console.error("No se encontró una ruta adecuada")
                  updatedTrip.routes.push(null)
                  updatedTrip.roadDistances.push(0)
                }
              } catch (error) {
                console.error("Error al obtener la ruta:", error)
                // Continuamos sin la ruta, pero con los marcadores
                updatedTrip.routes.push(null)
                updatedTrip.roadDistances.push(0)
              }

              // Actualizar el estado
              setMultiDestinations([...multiDestinations, newDestination])
              setCurrentTrip(updatedTrip)
              currentTripRef.current = updatedTrip
            }
          } else {
            // Modo normal (un solo destino)
            // Si no existe un viaje en curso, interpretamos el clic como el origen
            if (!currentTripRef.current) {
              console.log("Creando nuevo viaje - origen")
              // Obtenemos la dirección del clic (geocodificación inversa)
              let originAddress
              try {
                originAddress = await getAddress(e.latlng.lat, e.latlng.lng)
                console.log("Dirección de origen obtenida:", originAddress)
              } catch (error) {
                console.error("Error al obtener dirección de origen:", error)
                originAddress = "Dirección desconocida, Gualeguaychú"
              }

              // Creamos un nuevo objeto viaje con la información del origen
              const newTripData = {
                id: Date.now(),
                origin: e.latlng,
                originAddress,
                destination: null,
                destinationAddress: "",
                markers: [],
                route: null,
                roadDistance: null,
                price: null,
                completed: false,
                color: null,
              }

              // Agregamos un marcador en el mapa para el origen con evento de clic
              const originMarker = L.current
                .marker(e.latlng, { icon: originIcon })
                .addTo(map)
                .bindPopup("Origen: " + originAddress)
                .openPopup()

              // Añadir evento de clic al marcador para eliminarlo
              originMarker.on("click", (event) => {
                // Detener la propagación para evitar que el evento llegue al mapa
                L.current.DomEvent.stopPropagation(event)
                confirmDeleteMarker(originMarker, true)
              })

              newTripData.markers.push(originMarker)
              setCurrentTrip(newTripData)
              currentTripRef.current = newTripData
              console.log("Viaje iniciado:", newTripData)
            }
            // Si el viaje ya tiene origen, el segundo clic se usa para definir el destino
            else if (!currentTripRef.current.destination) {
              console.log("Añadiendo destino al viaje actual")
              // Calculamos la distancia entre el origen y el nuevo clic para evitar errores por clics muy cercanos
              const distanceFromOrigin = getDistance(currentTripRef.current.origin, e.latlng)

              if (distanceFromOrigin < CLICK_THRESHOLD_KM) {
                console.log("Clic muy cercano al origen, ignorado.")
                clickProcessingRef.current = false
                return
              }

              // Obtenemos la dirección del destino a partir del clic
              let destinationAddress
              try {
                destinationAddress = await getAddress(e.latlng.lat, e.latlng.lng)
                console.log("Dirección de destino obtenida:", destinationAddress)
              } catch (error) {
                console.error("Error al obtener dirección de destino:", error)
                destinationAddress = "Dirección desconocida, Gualeguaychú"
              }

              // Actualizamos el viaje actual con el destino
              const updatedTrip = {
                ...currentTripRef.current,
                destination: e.latlng,
                destinationAddress,
              }

              // Colocamos un marcador para el destino con evento de clic
              const destinationMarker = L.current
                .marker(e.latlng, { icon: destinationIcon })
                .addTo(map)
                .bindPopup("Destino: " + destinationAddress)
                .openPopup()

              // Añadir evento de clic al marcador para eliminarlo
              destinationMarker.on("click", (event) => {
                // Detener la propagación para evitar que el evento llegue al mapa
                L.current.DomEvent.stopPropagation(event)
                confirmDeleteMarker(destinationMarker, false)
              })

              updatedTrip.markers.push(destinationMarker)

              // Calculamos la ruta entre origen y destino
              try {
                console.log("Calculando ruta")
                const url = `https://router.project-osrm.org/route/v1/driving/${updatedTrip.origin.lng},${updatedTrip.origin.lat};${updatedTrip.destination.lng},${updatedTrip.destination.lat}?overview=full&geometries=geojson`

                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

                const response = await fetch(url, { signal: controller.signal })
                clearTimeout(timeoutId)

                if (!response.ok) {
                  throw new Error(`Error HTTP: ${response.status}`)
                }

                const data = await response.json()

                if (data.routes && data.routes.length > 0) {
                  const roadDistance = data.routes[0].distance
                  updatedTrip.roadDistance = roadDistance
                  const routeGeo = data.routes[0].geometry
                  const latlngs = routeGeo.coordinates.map((coord) => [coord[1], coord[0]])

                  const selectedColor = routeColors[colorIndexRef.current]
                  colorIndexRef.current = (colorIndexRef.current + 1) % routeColors.length

                  console.log("Añadiendo ruta al mapa")
                  const routeLine = L.current.polyline(latlngs, { color: selectedColor }).addTo(map)
                  updatedTrip.route = routeLine
                  updatedTrip.price = (roadDistance / 1000) * appConfig.getPricePerKm()
                  updatedTrip.color = selectedColor
                } else {
                  console.error("No se encontró una ruta adecuada")
                }
              } catch (error) {
                console.error("Error al obtener la ruta:", error)
                // Continuamos sin la ruta, pero con los marcadores
              }

              // Finalmente se guarda el viaje completo y se limpia currentTrip
              console.log("Viaje completado:", updatedTrip)
              setTrips((prev) => [...prev, updatedTrip])
              setCurrentTrip(null)
              currentTripRef.current = null
            }
          }
        } catch (error) {
          console.error("Error en handleMapClick:", error)
        } finally {
          clickProcessingRef.current = false
        }
      }

      // Se añade el evento "click" al mapa
      map.on("click", handleMapClick)
      return () => {
        map.off("click", handleMapClick)
      }
    }
  }, [map, CLICK_THRESHOLD_KM, routeColors, multiDestinations, originIcon, destinationIcon])

  // Añadir una función para finalizar el viaje con múltiples destinos
  const finishMultiDestinationTrip = () => {
    if (!currentTripRef.current || multiDestinations.length === 0) return

    console.log("Finalizando viaje con múltiples destinos")
    const trip = { ...currentTripRef.current }

    // Guardar el viaje en la lista de viajes
    setTrips((prev) => [...prev, trip])

    // Limpiar el estado actual
    setCurrentTrip(null)
    currentTripRef.current = null
    setMultiDestinations([])

    // Desactivar el modo de múltiples destinos
    setMultiDestinationMode(false)
  }

  // Añadir una función para cancelar el viaje con múltiples destinos
  const cancelMultiDestinationTrip = () => {
    if (!currentTripRef.current) return

    console.log("Cancelando viaje con múltiples destinos")

    // Eliminar todos los marcadores y rutas del mapa
    if (map) {
      currentTripRef.current.markers.forEach((marker) => {
        map.removeLayer(marker)
      })

      if (currentTripRef.current.routes) {
        currentTripRef.current.routes.forEach((route) => {
          if (route) map.removeLayer(route)
        })
      }
    }

    // Limpiar el estado actual
    setCurrentTrip(null)
    currentTripRef.current = null
    setMultiDestinations([])

    // Desactivar el modo de múltiples destinos
    setMultiDestinationMode(false)
  }

  // Crear una función memoizada para setMap
  const handleMapReady = useCallback((mapInstance, leafletInstance) => {
    console.log("Mapa recibido en el componente principal")
    setMap(mapInstance)
    setMapReady(true)

    // Store the Leaflet instance
    L.current = leafletInstance

    // Initialize icons once Leaflet is available
    if (leafletInstance) {
      setOriginIcon(
        leafletInstance.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png", // Marcador rojo para origen
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        }),
      )

      setDestinationIcon(
        leafletInstance.icon({
          iconUrl: "https://img.icons8.com/color/48/ff0000/marker.png", // Marcador azul para destino
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        }),
      )
    }
  }, [])

  // Función para crear manualmente un viaje con múltiples destinos
  const handleCreateManualTrip = async () => {
    if (!map || !L.current || !originIcon || !destinationIcon) {
      setManualError("El mapa no está listo. Por favor, espere un momento.")
      return
    }

    if (!manualOriginQuery || manualDestinationQueries.some((q) => !q)) {
      setManualError("Por favor, ingrese todas las direcciones.")
      return
    }

    // Obtener coordenadas del origen
    const originData = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualOriginQuery)}&viewbox=${GUALEGUAYCHU_VIEWBOX}&bounded=1&countrycodes=ar`,
    )
      .then((res) => res.json())
      .then((data) => (data && data.length > 0 ? data[0] : null))

    if (!originData) {
      setManualError("No se encontró el origen en Entre Ríos, Gualeguaychú.")
      return
    }

    const originCoord = {
      lat: Number.parseFloat(originData.lat),
      lng: Number.parseFloat(originData.lon),
    }

    const originAddress = originData.address
      ? (originData.address.road || originData.address.pedestrian || originData.address.cycleway || "") +
        (originData.address.house_number ? `, ${originData.house_number}` : "") +
        ", Gualeguaychú"
      : manualOriginQuery + ", Gualeguaychú"

    // Obtener coordenadas de todos los destinos
    const destinationsData = []
    for (let i = 0; i < manualDestinationQueries.length; i++) {
      const query = manualDestinationQueries[i]
      const destData = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${GUALEGUAYCHU_VIEWBOX}&bounded=1&countrycodes=ar`,
      )
        .then((res) => res.json())
        .then((data) => (data && data.length > 0 ? data[0] : null))

      if (!destData) {
        setManualError(`No se encontró el destino ${i + 1} en Entre Ríos, Gualeguaychú.`)
        return
      }

      const destCoord = {
        lat: Number.parseFloat(destData.lat),
        lng: Number.parseFloat(destData.lon),
      }

      const destAddress = destData.address
        ? (destData.address.road || destData.address.pedestrian || destData.address.cycleway || "") +
          (destData.address.house_number ? `, ${destData.house_number}` : "") +
          ", Gualeguaychú"
        : query + ", Gualeguaychú"

      destinationsData.push({
        coord: destCoord,
        address: destAddress,
      })
    }

    // Verificar que no haya destinos demasiado cercanos
    let previousPoint = originCoord
    for (let i = 0; i < destinationsData.length; i++) {
      const currentPoint = destinationsData[i].coord
      if (getDistance(previousPoint, currentPoint) < CLICK_THRESHOLD_KM) {
        setManualError(`El origen y el destino ${i + 1} son demasiado cercanos. Seleccione direcciones distintas.`)
        return
      }
      previousPoint = currentPoint
    }

    // Verificar que no sea un viaje duplicado
    const duplicateTrip = trips.find((trip) => {
      if (!trip.destinations && trip.destination) {
        // Formato antiguo
        return (
          getDistance(trip.origin, originCoord) < 0.01 &&
          getDistance(trip.destination, destinationsData[0].coord) < 0.01
        )
      } else if (trip.destinations && trip.destinations.length === destinationsData.length) {
        // Mismo número de destinos, verificar cada uno
        return (
          getDistance(trip.origin, originCoord) < 0.01 &&
          trip.destinations.every((dest, idx) => getDistance(dest.coord, destinationsData[idx].coord) < 0.01)
        )
      }
      return false
    })

    if (duplicateTrip) {
      setManualError("El viaje ya ha sido creado.")
      return
    }

    // Seleccionar un color para todo el viaje
    const selectedColor = routeColors[colorIndexRef.current]
    colorIndexRef.current = (colorIndexRef.current + 1) % routeColors.length

    // Crear el nuevo viaje
    const newTrip = {
      id: Date.now(),
      origin: originCoord,
      originAddress,
      destinations: destinationsData,
      markers: [],
      routes: [],
      roadDistances: [],
      totalDistance: 0,
      price: null,
      completed: false,
      color: selectedColor, // Usar un solo color para todo el viaje
    }

    try {
      // Crear marcador de origen
      const originMarker = L.current
        .marker([originCoord.lat, originCoord.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup("Origen: " + originAddress)
        .openPopup()

      // Añadir evento de clic al marcador para eliminarlo
      originMarker.on("click", (event) => {
        L.current.DomEvent.stopPropagation(event)
        confirmDeleteMarker(originMarker, true)
      })

      newTrip.markers.push(originMarker)

      // Crear marcadores para cada destino
      for (let i = 0; i < destinationsData.length; i++) {
        const dest = destinationsData[i]
        const destMarker = L.current
          .marker([dest.coord.lat, dest.coord.lng], { icon: destinationIcon })
          .addTo(map)
          .bindPopup(`Destino ${i + 1}: ${dest.address}`)
          .openPopup()

        // Añadir evento de clic al marcador
        destMarker.on("click", (event) => {
          L.current.DomEvent.stopPropagation(event)
          confirmDeleteMarker(destMarker, false)
        })

        newTrip.markers.push(destMarker)
      }

      // Calcular rutas entre cada punto
      let totalDistance = 0
      let previousPoint = originCoord

      for (let i = 0; i < destinationsData.length; i++) {
        const currentPoint = destinationsData[i].coord
        const url = `https://router.project-osrm.org/route/v1/driving/${previousPoint.lng},${previousPoint.lat};${currentPoint.lng},${currentPoint.lat}?overview=full&geometries=geojson`

        const response = await fetch(url)
        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const routeDistance = data.routes[0].distance
          newTrip.roadDistances.push(routeDistance)
          totalDistance += routeDistance

          const routeGeo = data.routes[0].geometry
          const latlngs = routeGeo.coordinates.map((coord) => [coord[1], coord[0]])

          // Usar el mismo color para todas las rutas
          const routeLine = L.current.polyline(latlngs, { color: selectedColor }).addTo(map)
          newTrip.routes.push(routeLine)
        } else {
          newTrip.routes.push(null)
          newTrip.roadDistances.push(0)
          console.error(`No se encontró una ruta adecuada para el tramo ${i + 1}`)
        }

        previousPoint = currentPoint
      }

      newTrip.totalDistance = totalDistance
      newTrip.price = (totalDistance / 1000) * appConfig.getPricePerKm()

      setTrips((prev) => [...prev, newTrip])
      setManualError("")
    } catch (error) {
      console.error("Error al crear el viaje:", error)
      setManualError("Error al crear el viaje. Por favor, intente nuevamente.")
    }
  }

  const tripsToday = trips.filter((trip) => {
    const tripDate = new Date(trip.id)
    const today = new Date()
    return (
      tripDate.getFullYear() === today.getFullYear() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getDate() === today.getDate()
    )
  }).length

  const completedTripsCount = history.length

  // Función para geocodificar una dirección
  const geocodeAddress = async (address) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&viewbox=${GUALEGUAYCHU_VIEWBOX}&bounded=1&countrycodes=ar`
      const response = await fetch(url)
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      } else {
        console.warn(`No se encontraron coordenadas para la dirección: ${address}`)
        return null
      }
    } catch (error) {
      console.error("Error al geocodificar la dirección:", error)
      return null
    }
  }

  // Añadir una función para mostrar un viaje asignado en el mapa
  // Añadir after las otras funciones de manejo de viajes:

  // Función para geocodificar una dirección (convertir dirección a coordenadas)
  const geocodeAddressFn = async (address) => {
    try {
      // Asegurarse de que la dirección incluya "Gualeguaychú" para mejorar la precisión
      const searchAddress = address.toLowerCase().includes("gualeguaychú") ? address : `${address}, Gualeguaychú`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&viewbox=${GUALEGUAYCHU_VIEWBOX}&bounded=1&countrycodes=ar`,
        { signal: controller.signal },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }

      // Si no se encuentra con Gualeguaychú, intentar sin la ciudad
      if (searchAddress !== address) {
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar`,
        )
        const fallbackData = await fallbackResponse.json()

        if (fallbackData && fallbackData.length > 0) {
          return {
            lat: Number.parseFloat(fallbackData[0].lat),
            lng: Number.parseFloat(fallbackData[0].lon),
          }
        }
      }

      return null
    } catch (error) {
      console.error("Error al geocodificar dirección:", error)
      return null
    }
  }

  // Función para mostrar un viaje asignado en el mapa
  const showAssignedTripOnMap = useCallback(
    (trip) => {
      if (!map || !L.current || !originIcon || !destinationIcon) return

      // Limpiar cualquier viaje asignado previo
      if (assignedTripOnMap) {
        assignedTripOnMap.markers.forEach((marker) => {
          map.removeLayer(marker)
        })
        if (assignedTripOnMap.routes) {
          assignedTripOnMap.routes.forEach((route) => {
            if (route) map.removeLayer(route)
          })
        }
      }

      // Crear un nuevo objeto para el viaje con marcadores y rutas
      const newTripOnMap = {
        ...trip,
        markers: [],
        routes: [],
      }

      // Geocodificar las direcciones para obtener coordenadas
      const processTrip = async () => {
        try {
          // Obtener coordenadas del origen
          const originCoords = await geocodeAddressFn(trip.originAddress)
          if (!originCoords) throw new Error("No se pudo geocodificar el origen")

          // Crear marcador de origen
          const originMarker = L.current
            .marker([originCoords.lat, originCoords.lng], { icon: originIcon })
            .addTo(map)
            .bindPopup("Origen: " + trip.originAddress)

          newTripOnMap.markers.push(originMarker)

          // Procesar destinos
          const destinations = trip.destinationAddresses || [trip.destinationAddress]
          let previousPoint = originCoords

          for (let i = 0; i < destinations.length; i++) {
            const destAddress = destinations[i]
            const destCoords = await geocodeAddressFn(destAddress)
            if (!destCoords) continue

            // Crear marcador de destino
            const destMarker = L.current
              .marker([destCoords.lat, destCoords.lng], { icon: destinationIcon })
              .addTo(map)
              .bindPopup(`Destino ${i + 1}: ${destAddress}`)

            newTripOnMap.markers.push(destMarker)

            // Calcular y mostrar ruta
            try {
              const url = `https://router.project-osrm.org/route/v1/driving/${previousPoint.lng},${previousPoint.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`
              const response = await fetch(url)
              const data = await response.json()

              if (data.routes && data.routes.length > 0) {
                const routeGeo = data.routes[0].geometry
                const latlngs = routeGeo.coordinates.map((coord) => [coord[1], coord[0]])

                // Usar un color distintivo para los viajes asignados
                const routeLine = L.current.polyline(latlngs, { color: "#9333ea", weight: 5, opacity: 0.7 }).addTo(map)
                newTripOnMap.routes.push(routeLine)
              }
            } catch (error) {
              console.error("Error al obtener ruta:", error)
            }

            previousPoint = destCoords
          }

          // Ajustar la vista del mapa para mostrar todos los marcadores
          if (newTripOnMap.markers.length > 0) {
            const group = L.current.featureGroup(newTripOnMap.markers)
            map.fitBounds(group.getBounds(), { padding: [50, 50] })
          }

          // Guardar el viaje en el estado
          setAssignedTripOnMap(newTripOnMap)
        } catch (error) {
          console.error("Error al procesar viaje asignado:", error)
        }
      }

      processTrip()
    },
    [map, assignedTripOnMap, originIcon, destinationIcon],
  )

  // Añadir una función para actualizar el contador de viajes pendientes
  const updatePendingTripsCount = useCallback((count) => {
    setPendingAssignedTripsCount(count)
  }, [])

  // Reemplazar el return del componente with this versión mejorada
  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-6xl mx-auto bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white min-h-screen">
      {/* Y en la sección del header, añadir: */}
      <header className="w-full mb-4 sm:mb-6 text-center relative">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-blue-800 dark:text-blue-300">
          Calculador de Viajes
          {isDemoMode && <Badge className="ml-2 bg-yellow-500 text-white text-xs">DEMO</Badge>}
          {pendingAssignedTripsCount > 0 && (
            <Badge className="ml-2 bg-purple-600 text-white text-xs">
              {pendingAssignedTripsCount} viaje{pendingAssignedTripsCount > 1 ? "s" : ""} asignado
              {pendingAssignedTripsCount > 1 ? "s" : ""}
            </Badge>
          )}
        </h1>
        <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">
          Planifica y gestiona tus rutas de manera eficiente
        </p>
        <div className="absolute right-0 top-0 flex gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin")}
              title="Panel de Administración"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Users className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title={isDemoMode ? "Salir del modo demo" : "Cerrar sesión"}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        {profile && (
          <div className="absolute left-0 top-0 text-sm text-blue-600 dark:text-blue-400">
            <p className="font-semibold">{`${profile.name} ${profile.last_name}`}</p>
            <p className="text-xs opacity-80">
              ID: {profile.cadete_id} • {profile.transport_type === "bicicleta" ? "Bicicleta" : "Moto"}
            </p>
          </div>
        )}
      </header>

      {/* Modificar el componente AssignedTrips para pasarle la función de mostrar en mapa
      // Buscar donde se renderiza el componente AssignedTrips y modificarlo: */}

      {/* Componente de viajes asignados */}
      <AssignedTrips onShowInMap={showAssignedTripOnMap} onUpdatePendingCount={updatePendingTripsCount} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 w-full">
        {/* Panel izquierdo - Formulario */}
        <div className="md:col-span-1">
          <Card className="shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Crear Nuevo Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5">
              <div className="space-y-3 sm:space-y-4">
                {/* Input para origen con sugerencias */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">
                    Origen
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                    <Input
                      type="text"
                      value={manualOriginQuery}
                      onChange={handleOriginInputChange}
                      placeholder="Ej: Luis N Palma 2"
                      className="pl-7 sm:pl-8 border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400"
                    />
                  </div>
                  {originSuggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-blue-200 dark:ring-gray-600 focus:outline-none">
                      {originSuggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-xs sm:text-sm"
                          onClick={() => handleSelectOriginSuggestion(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Inputs para destinos con sugerencias */}
                {manualDestinationQueries.map((query, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                        Destino {manualDestinationQueries.length > 1 ? index + 1 : ""}
                      </label>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeDestination(index)}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Navigation className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                      <Input
                        type="text"
                        value={query}
                        onChange={(e) => handleDestinationInputChange(e, index)}
                        placeholder="Ej: Luis N Palma 2"
                        className="pl-7 sm:pl-8 border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400"
                      />
                    </div>
                    {activeDestinationIndex === index && destinationSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-blue-200 dark:ring-gray-600 focus:outline-none">
                        {destinationSuggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-xs sm:text-sm"
                            onClick={() => handleSelectDestinationSuggestion(suggestion)}
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDestination}
                  className="w-full text-xs sm:text-sm border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Agregar otro destino
                </Button>

                {manualError && (
                  <Alert variant="destructive" className="py-1 sm:py-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <AlertDescription className="text-xs ml-2">{manualError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleCreateManualTrip}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-xs sm:text-sm py-1 h-8 sm:h-10"
                    disabled={!mapReady}
                  >
                    <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Crear Viaje
                  </Button>
                  <Button
                    onClick={resetTrips}
                    variant="destructive"
                    className="w-full text-xs sm:text-sm py-1 h-8 sm:h-10"
                  >
                    Reiniciar Todo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-1 gap-3">
            {/* Modo de selección múltiple */}
            <Card className="shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Selección manual en mapa</p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs ${
                        multiDestinationMode ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {multiDestinationMode ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      onClick={() => setMultiDestinationMode(!multiDestinationMode)}
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        multiDestinationMode
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {multiDestinationMode ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {multiDestinationMode
                    ? "Haga clic en el mapa para marcar un origen y múltiples destinos. Finalice el viaje con el botón."
                    : "Haga clic dos veces en el mapa: primero para marcar el origen y luego para el destino."}
                </p>
                {multiDestinationMode && currentTrip && multiDestinations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p>Origen: {currentTrip.originAddress}</p>
                      {multiDestinations.map((dest, idx) => (
                        <p key={idx}>
                          Destino {idx + 1}: {dest.address}
                        </p>
                      ))}
                      {currentTrip.totalDistance > 0 && (
                        <p>Distancia total: {(currentTrip.totalDistance / 1000).toFixed(2)} km</p>
                      )}
                      {currentTrip.price > 0 && <p>Precio estimado: ${currentTrip.price.toFixed(2)}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={finishMultiDestinationTrip}
                        className="w-full text-xs bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      >
                        Finalizar Viaje
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={cancelMultiDestinationTrip}
                        className="w-full text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información de viajes */}
            <Card className="shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    <span className="font-bold">{tripsToday}</span> viajes realizados hoy
                  </p>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    <span className="font-bold">{completedTripsCount}</span> viajes completados
                  </p>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    <span className="font-bold">${appConfig.getPricePerKm()}</span> por kilómetro
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Panel del medio y derecho - Mapa y Viajes */}
        <div className="md:col-span-2 grid grid-cols-1 gap-3 sm:gap-6">
          {/* Mapa */}
          <Card className="shadow-md border-blue-100 dark:border-gray-700 min-h-[300px] md:min-h-[500px]">
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <MapClient onMapReady={handleMapReady} />
            </CardContent>
          </Card>

          {/* Lista de viajes activos */}
          {trips.length > 0 && (
            <Card className="shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                  Viajes Activos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 divide-y divide-blue-100 dark:divide-gray-700">
                  {trips.map((trip) => (
                    <div key={trip.id} className="p-3 sm:p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                            <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                              Origen:
                            </div>
                            <div className="text-xs sm:text-sm">{trip.originAddress}</div>
                          </div>

                          {trip.destinations ? (
                            // Para viajes con múltiples destinos
                            trip.destinations.map((dest, idx) => (
                              <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                                <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                                  Destino {trip.destinations.length > 1 ? idx + 1 : ""}:
                                </div>
                                <div className="text-xs sm:text-sm">{dest.address}</div>
                              </div>
                            ))
                          ) : (
                            // Para viajes con un solo destino
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                              <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                                Destino:
                              </div>
                              <div className="text-xs sm:text-sm">{trip.destinationAddress}</div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-blue-700 dark:text-blue-300">Distancia:</span>
                              <span>
                                {trip.totalDistance
                                  ? (trip.totalDistance / 1000).toFixed(2)
                                  : (trip.roadDistance / 1000).toFixed(2)}{" "}
                                km
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-blue-700 dark:text-blue-300">Precio:</span>
                              <span>${trip.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
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
                            variant="secondary"
                            onClick={() => confirmCompleteTrip(trip.id)}
                            title="Marcar viaje como completado"
                            className="h-7 sm:h-8 text-xs sm:text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 border-green-300 dark:border-green-700"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Completar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTrip(trip.id)}
                            title="Eliminar viaje"
                            className="h-7 sm:h-8 text-xs sm:text-sm"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de viajes */}
          {history.length > 0 && (
            <Card className="shadow-md border-blue-100 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Historial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 divide-y divide-blue-100 dark:divide-gray-700">
                  {history.map((trip) => (
                    <div key={trip.id} className="p-3 sm:p-4">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                          <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">Origen:</div>
                          <div className="text-xs sm:text-sm">{trip.originAddress}</div>
                        </div>

                        {trip.destinations ? (
                          // Para viajes con múltiples destinos
                          trip.destinations.map((dest, idx) => (
                            <div key={idx} className="flex items-center gap-1 sm:gap-2">
                              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                              <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                                Destino {trip.destinations.length > 1 ? idx + 1 : ""}:
                              </div>
                              <div className="text-xs sm:text-sm">{dest.address}</div>
                            </div>
                          ))
                        ) : (
                          // Para viajes con un solo destino
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                            <div className="font-medium text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                              Destino:
                            </div>
                            <div className="text-xs sm:text-sm">{trip.destinationAddress}</div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Distancia:</span>
                            <span>
                              {trip.totalDistance
                                ? (trip.totalDistance / 1000).toFixed(2)
                                : (trip.roadDistance / 1000).toFixed(2)}{" "}
                              km
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Precio:</span>
                            <span>${trip.price.toFixed(2)}</span>
                          </div>
                          <Badge className="self-start sm:self-auto mt-1 sm:mt-0 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Completado
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar marcador */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContentComponent className="max-w-[90%] sm:max-w-lg">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="text-base sm:text-lg">
              Confirmar eliminación
            </AlertDialogTitleComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogDescriptionComponent className="text-xs sm:text-sm">
            ¿Estás seguro de que deseas eliminar este punto? Esta acción no se puede deshacer.
          </AlertDialogDescriptionComponent>
          <AlertDialogFooter>
            <AlertDialogCancelComponent className="text-xs sm:text-sm">Cancelar</AlertDialogCancelComponent>
            <AlertDialogActionComponent
              onClick={handleDeleteMarker}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            >
              Eliminar
            </AlertDialogActionComponent>
          </AlertDialogFooter>
        </AlertDialogContentComponent>
      </AlertDialog>

      {/* Diálogo de confirmación para completar viaje */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContentComponent className="max-w-[90%] sm:max-w-lg">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              Confirmar viaje completado
            </AlertDialogTitleComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogDescriptionComponent className="text-xs sm:text-sm">
            ¿Estás seguro de que deseas marcar este viaje como completado? Esta acción moverá el viaje al historial.
          </AlertDialogDescriptionComponent>
          <AlertDialogFooter>
            <AlertDialogCancelComponent className="text-xs sm:text-sm">Cancelar</AlertDialogCancelComponent>
            <AlertDialogActionComponent
              onClick={handleCompleteTrip}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            >
              Completar
            </AlertDialogActionComponent>
          </AlertDialogFooter>
        </AlertDialogContentComponent>
      </AlertDialog>
    </div>
  )
}

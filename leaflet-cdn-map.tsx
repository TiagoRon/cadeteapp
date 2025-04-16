"use client"

import { useEffect, useRef, useState } from "react"
import { MapIcon } from "lucide-react"

export default function LeafletCdnMap({ onMapReady }) {
  const mapRef = useRef(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapInstanceRef = useRef(null)
  const mapIdRef = useRef(`map-container-${Math.random().toString(36).substring(2, 9)}`)

  // Cargar Leaflet desde CDN
  useEffect(() => {
    // Función para cargar el CSS de Leaflet
    const loadLeafletCSS = () => {
      return new Promise((resolve, reject) => {
        if (document.querySelector('link[href*="leaflet.css"]')) {
          resolve(true)
          return
        }

        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        link.onload = () => resolve(true)
        link.onerror = () => reject(new Error("Failed to load Leaflet CSS"))
        document.head.appendChild(link)
      })
    }

    // Función para cargar el JS de Leaflet
    const loadLeafletJS = () => {
      return new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L)
          return
        }

        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""
        script.async = true
        script.onload = () => resolve(window.L)
        script.onerror = () => reject(new Error("Failed to load Leaflet JS"))
        document.head.appendChild(script)
      })
    }

    // Inicializar el mapa
    const initializeMap = async () => {
      if (isMapInitialized || !mapRef.current) return

      setIsLoading(true)
      setError(null)

      try {
        // Cargar CSS y JS de Leaflet
        await loadLeafletCSS()
        const L = await loadLeafletJS()

        console.log("Leaflet cargado correctamente", !!L)

        // Esperar un momento para asegurarse de que el DOM está listo
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Limpiar cualquier mapa existente
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Inicializar el mapa
        console.log("Inicializando mapa con ID:", mapIdRef.current)
        const map = L.map(mapRef.current, {
          // Opciones adicionales para mejorar la compatibilidad
          preferCanvas: true,
          attributionControl: false,
          zoomControl: true,
        }).setView([-33.0241, -58.4971], 13)

        // Añadir capa de tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Crear íconos personalizados
        const originIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        })

        const destinationIcon = L.icon({
          iconUrl: "https://img.icons8.com/color/48/ff0000/marker.png",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        })

        // Guardar la instancia del mapa
        mapInstanceRef.current = map
        setIsMapInitialized(true)
        setIsLoading(false)

        // Notificar que el mapa está listo
        if (onMapReady) {
          onMapReady(map, L, { originIcon, destinationIcon })
        }

        // Invalidar el tamaño del mapa después de un breve retraso
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)
      } catch (error) {
        console.error("Error al inicializar el mapa:", error)
        setError(`Error al inicializar el mapa: ${error.message}`)
        setIsLoading(false)
      }
    }

    // Pequeño retraso antes de inicializar el mapa
    const timer = setTimeout(() => {
      initializeMap()
    }, 200)

    // Limpiar al desmontar
    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          console.log("Mapa eliminado correctamente")
        } catch (error) {
          console.error("Error al limpiar el mapa:", error)
        }
      }
    }
  }, [onMapReady])

  // Manejar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full border border-slate-200 dark:border-gray-700 rounded-lg shadow-md transition-all duration-300">
      <div id={mapIdRef.current} ref={mapRef} className="h-full w-full z-10" />

      {/* Estado de carga o error */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-gray-800/80 z-20">
          <div className="text-center">
            <MapIcon className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-500 dark:text-blue-400" />
            <p className="text-blue-600 dark:text-blue-400">Inicializando mapa...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-gray-800/80 z-20">
          <div className="text-center max-w-xs">
            <MapIcon className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

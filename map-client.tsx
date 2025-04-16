"use client"

import { useState, useEffect, useRef } from "react"
import { MapIcon } from "lucide-react"

export default function MapClient({ onMapReady }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const leafletRef = useRef(null)
  const [key, setKey] = useState(Date.now())

  useEffect(() => {
    // Function to load Leaflet CSS
    const loadCSS = () => {
      return new Promise((resolve, reject) => {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.onload = () => resolve()
        link.onerror = () => reject(new Error("Failed to load Leaflet CSS"))
        document.head.appendChild(link)
      })
    }

    // Function to load Leaflet JS
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.async = true
        script.onload = () => {
          leafletRef.current = window.L
          resolve(window.L)
        }
        script.onerror = () => reject(new Error("Failed to load Leaflet JS"))
        document.head.appendChild(script)
      })
    }

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load CSS and JS
        await loadCSS()
        const L = await loadScript()

        // Wait a bit to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        if (!mapRef.current) {
          throw new Error("Map container not found")
        }

        // Clean up any existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        // Create map
        console.log("Creating map...")
        const map = L.map(mapRef.current).setView([-33.0241, -58.4971], 13)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Create icons
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

        // Store map instance
        mapInstanceRef.current = map

        // Notify parent component
        if (onMapReady) {
          onMapReady(map, L, { originIcon, destinationIcon })
        }

        // Invalidate size after a delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)

        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing map:", err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [onMapReady, key])

  // Handle window resize
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
    <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
      <div ref={mapRef} className="h-full w-full" style={{ zIndex: 1 }}></div>

      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-gray-800/80"
          style={{ zIndex: 2 }}
        >
          <div className="text-center">
            <MapIcon className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-500 dark:text-blue-400" />
            <p className="text-blue-600 dark:text-blue-400">Cargando mapa...</p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-gray-800/80"
          style={{ zIndex: 2 }}
        >
          <div className="text-center max-w-xs">
            <MapIcon className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={() => setKey(Date.now())}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

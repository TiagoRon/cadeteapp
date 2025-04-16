"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"
import { demoUsers } from "@/lib/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, MapIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import L from "leaflet"

// Importación dinámica del mapa para evitar problemas de SSR
const MapComponent = () => {
  const { isDemoMode } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [showOffline, setShowOffline] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        let userData = []

        if (isDemoMode) {
          // En modo de demostración, usar datos de demostración
          userData = demoUsers
        } else {
          // En modo real, obtener datos de Supabase
          const { data, error } = await supabase.from("cadetes").select("*")
          if (error) throw error
          userData = data
        }

        setUsers(userData)
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()

    // Configurar intervalo para actualizar ubicaciones (solo en modo demo)
    if (isDemoMode) {
      const interval = setInterval(() => {
        // Simular movimiento de cadetes
        const updatedUsers = demoUsers.map((user) => {
          if (user.online) {
            return {
              ...user,
              location: {
                lat: user.location.lat + (Math.random() - 0.5) * 0.001,
                lng: user.location.lng + (Math.random() - 0.5) * 0.001,
              },
            }
          }
          return user
        })

        setUsers(updatedUsers)
      }, 5000) // Actualizar cada 5 segundos

      return () => clearInterval(interval)
    }
  }, [isDemoMode])

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Crear el mapa
    const map = L.map(mapRef.current).setView([-33.0241, -58.4971], 13)

    // Añadir capa de tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    // Guardar la instancia del mapa
    mapInstanceRef.current = map

    // Limpiar al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Actualizar marcadores cuando cambian los usuarios
  useEffect(() => {
    if (!mapInstanceRef.current || users.length === 0) return

    // Limpiar marcadores existentes
    Object.values(markersRef.current).forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })

    markersRef.current = {}

    // Filtrar usuarios según el estado del switch
    const filteredUsers = showOffline ? users : users.filter((user) => user.online)

    // Crear nuevos marcadores
    filteredUsers.forEach((user) => {
      if (!user.location) return

      // Crear icono según el tipo de transporte
      const icon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="marker-pin ${user.online ? "online" : "offline"} ${user.transport_type === "bicicleta" ? "bike" : "moto"}">
                <span>${user.name.charAt(0)}${user.last_name.charAt(0)}</span>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      // Crear marcador
      const marker = L.marker([user.location.lat, user.location.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <div style="font-weight: bold;">${user.name} ${user.last_name}</div>
            <div>${user.cadete_id}</div>
            <div style="margin-top: 5px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 12px; background-color: ${user.online ? "#10b981" : "#6b7280"}; color: white;">
                ${user.online ? "En línea" : "Desconectado"}
              </span>
            </div>
            <div style="margin-top: 5px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 12px; background-color: ${user.transport_type === "bicicleta" ? "#3b82f6" : "#8b5cf6"}; color: white;">
                ${user.transport_type === "bicicleta" ? "Bicicleta" : "Moto"}
              </span>
            </div>
          </div>
        `)

      markersRef.current[user.id] = marker
    })

    // Ajustar la vista del mapa para mostrar todos los marcadores si hay al menos uno
    if (Object.keys(markersRef.current).length > 0) {
      const markers = Object.values(markersRef.current)
      const group = L.featureGroup(markers)
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] })
    }
  }, [users, showOffline])

  // Estilos CSS para los marcadores
  useEffect(() => {
    if (typeof document === "undefined") return

    // Crear estilos para los marcadores
    const style = document.createElement("style")
    style.innerHTML = `
      .marker-pin {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      }
      .marker-pin.online.bike {
        background-color: #3b82f6;
      }
      .marker-pin.online.moto {
        background-color: #8b5cf6;
      }
      .marker-pin.offline {
        background-color: #6b7280;
        opacity: 0.7;
      }
    `

    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Mapa de Cadetes</CardTitle>
            <CardDescription>Visualiza la ubicación en tiempo real de los cadetes</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-offline" checked={showOffline} onCheckedChange={setShowOffline} />
            <Label htmlFor="show-offline">Mostrar desconectados</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md">
              <div className="text-sm font-medium mb-1">Leyenda</div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs">Bicicleta (en línea)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-xs">Moto (en línea)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                  <span className="text-xs">Desconectado</span>
                </div>
              </div>
            </div>
            <div
              ref={mapRef}
              className="h-[500px] w-full border border-slate-200 dark:border-gray-700 rounded-lg shadow-md"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Exportar el componente con carga dinámica para evitar problemas de SSR
export default dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Mapa de Cadetes</CardTitle>
        <CardDescription>Visualiza la ubicación en tiempo real de los cadetes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full flex items-center justify-center bg-slate-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <MapIcon className="h-10 w-10 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
            <p className="text-slate-500 dark:text-slate-400">Cargando mapa...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
})

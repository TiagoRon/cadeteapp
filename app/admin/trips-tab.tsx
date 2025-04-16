"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { demoMode } from "@/lib/demo-mode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search, Calendar, MapPin, Navigation, CheckCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function TripsTab() {
  const { isDemoMode } = useAuth()
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [users, setUsers] = useState([])

  // Cargar usuarios y viajes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        let userData = []
        let tripsData = []

        if (isDemoMode) {
          // En modo de demostración, usar datos de demostración
          userData = demoMode.getUsers()
          tripsData = demoMode.getTrips()
        } else {
          // En modo real, obtener datos de Supabase
          const { data: usersData, error: usersError } = await supabase.from("cadetes").select("*")
          if (usersError) throw usersError
          userData = usersData

          // Aquí deberías implementar la lógica para obtener los viajes de la base de datos
          // Por ahora, usaremos datos de demostración
          tripsData = demoMode.getTrips()
        }

        setUsers(userData)
        setTrips(tripsData)
        setFilteredTrips(tripsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isDemoMode])

  // Filtrar viajes cuando cambian los filtros
  useEffect(() => {
    let filtered = [...trips]

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (trip) =>
          trip.originAddress.toLowerCase().includes(term) ||
          (trip.destinationAddress && trip.destinationAddress.toLowerCase().includes(term)),
      )
    }

    // Filtrar por tiempo
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (timeFilter === "today") {
      filtered = filtered.filter((trip) => {
        const tripDate = new Date(trip.created_at)
        return tripDate >= today
      })
    } else if (timeFilter === "month") {
      filtered = filtered.filter((trip) => {
        const tripDate = new Date(trip.created_at)
        return tripDate >= thisMonth
      })
    }

    // Filtrar por usuario
    if (userFilter !== "all") {
      filtered = filtered.filter((trip) => trip.user_id === userFilter)
    }

    setFilteredTrips(filtered)
  }, [searchTerm, timeFilter, userFilter, trips])

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

  // Obtener nombre de usuario
  const getUserName = (userId) => {
    const user = users.find((u) => u.user_id === userId)
    return user ? `${user.name} ${user.last_name}` : "Usuario desconocido"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Historial de Viajes</CardTitle>
        <CardDescription>Visualiza y filtra los viajes realizados por los cadetes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.user_id}>
                    {user.name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla de viajes */}
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
                  <TableHead>Destino</TableHead>
                  <TableHead>Distancia</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No se encontraron viajes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span>{formatDate(trip.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getUserName(trip.user_id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="truncate max-w-[150px]">{trip.originAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-blue-500" />
                          <span className="truncate max-w-[150px]">
                            {trip.destinationAddress || (trip.destinations && trip.destinations[0]?.address)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{trip.roadDistance ? (trip.roadDistance / 1000).toFixed(2) : "N/A"} km</TableCell>
                      <TableCell>${trip.price ? trip.price.toFixed(2) : "N/A"}</TableCell>
                      <TableCell>
                        {trip.completed ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                          >
                            En curso
                          </Badge>
                        )}
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
  )
}

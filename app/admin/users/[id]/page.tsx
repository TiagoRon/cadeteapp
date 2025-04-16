"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { demoMode } from "@/lib/demo-mode"
import { demoUsers, generateTripsByDay, generateTripsByMonth } from "@/lib/config"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Bike,
  BikeIcon as MotorbikeFast,
  MapPin,
  Navigation,
  CheckCircle,
  BarChart3,
  LineChart,
} from "lucide-react"

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, isLoading: authLoading, isDemoMode } = useAuth()
  const [user, setUser] = useState(null)
  const [trips, setTrips] = useState([])
  const [tripsByDay, setTripsByDay] = useState([])
  const [tripsByMonth, setTripsByMonth] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")
  const [timeFilter, setTimeFilter] = useState("all")

  // Redireccionar si el usuario no es administrador
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
    }
  }, [isAdmin, authLoading, router])

  // Cargar datos del usuario y sus viajes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!params.id) return

      setIsLoading(true)
      try {
        let userData = null
        let userTrips = []

        if (isDemoMode) {
          // En modo de demostración, usar datos de demostración
          userData = demoUsers.find((u) => u.id === params.id)

          if (userData) {
            userTrips = demoMode.getTrips(userData.user_id)

            // Generar estadísticas por día y mes
            const dayStats = generateTripsByDay(userData.user_id, 30)
            const monthStats = generateTripsByMonth(userData.user_id, 12)

            setTripsByDay(dayStats)
            setTripsByMonth(monthStats)
          }
        } else {
          // En modo real, obtener datos de Supabase
          const { data, error } = await supabase.from("cadetes").select("*").eq("id", params.id).single()

          if (error) throw error
          userData = data

          // Aquí deberías implementar la lógica para obtener los viajes del usuario
          // y generar las estadísticas por día y mes
          if (userData) {
            userTrips = demoMode.getTrips(userData.user_id)

            // Generar estadísticas por día y mes (usando funciones de demostración por ahora)
            const dayStats = generateTripsByDay(userData.user_id, 30)
            const monthStats = generateTripsByMonth(userData.user_id, 12)

            setTripsByDay(dayStats)
            setTripsByMonth(monthStats)
          }
        }

        setUser(userData)
        setTrips(userTrips)
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [params.id, isDemoMode])

  // Filtrar viajes según el filtro de tiempo
  const filteredTrips = () => {
    if (!trips || trips.length === 0) return []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (timeFilter === "today") {
      return trips.filter((trip) => {
        const tripDate = new Date(trip.created_at)
        return tripDate >= today
      })
    } else if (timeFilter === "month") {
      return trips.filter((trip) => {
        const tripDate = new Date(trip.created_at)
        return tripDate >= thisMonth
      })
    }

    return trips
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

  // Calcular estadísticas
  const calculateStats = () => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        completedTrips: 0,
        totalDistance: 0,
        totalEarnings: 0,
      }
    }

    const completedTrips = trips.filter((trip) => trip.completed).length

    let totalDistance = 0
    let totalEarnings = 0

    trips.forEach((trip) => {
      if (trip.roadDistance) {
        totalDistance += trip.roadDistance
      } else if (trip.totalDistance) {
        totalDistance += trip.totalDistance
      }

      if (trip.price) {
        totalEarnings += trip.price
      }
    })

    return {
      totalTrips: trips.length,
      completedTrips,
      totalDistance: totalDistance / 1000, // Convertir a km
      totalEarnings,
    }
  }

  const stats = calculateStats()

  // Mostrar pantalla de carga mientras se verifica si el usuario es administrador
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-600 dark:text-blue-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no es administrador, no mostrar nada (se redirigirá en el useEffect)
  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Detalles del Usuario</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : !user ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Usuario no encontrado</p>
              <Button onClick={() => router.push("/admin")}>Volver al panel de administración</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Información básica del usuario */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {user.name} {user.last_name}
                    </CardTitle>
                    <CardDescription>ID de Cadete: {user.cadete_id}</CardDescription>
                  </div>
                  <div>
                    {user.transport_type === "bicicleta" ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                      >
                        <Bike className="h-4 w-4" />
                        Bicicleta
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                      >
                        <MotorbikeFast className="h-4 w-4" />
                        Moto
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total de viajes</div>
                    <div className="text-2xl font-bold mt-1">{stats.totalTrips}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Viajes completados</div>
                    <div className="text-2xl font-bold mt-1">{stats.completedTrips}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Distancia total</div>
                    <div className="text-2xl font-bold mt-1">{stats.totalDistance.toFixed(2)} km</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Ganancias totales</div>
                    <div className="text-2xl font-bold mt-1">${stats.totalEarnings.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pestañas para diferentes vistas */}
            <Tabs defaultValue="trips" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="trips" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Viajes</span>
                </TabsTrigger>
                <TabsTrigger value="daily" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Estadísticas Diarias</span>
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  <span>Estadísticas Mensuales</span>
                </TabsTrigger>
              </TabsList>

              {/* Pestaña de viajes */}
              <TabsContent value="trips">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-bold">Historial de Viajes</CardTitle>
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="today">Hoy</SelectItem>
                          <SelectItem value="month">Este mes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <CardDescription>Viajes realizados por el cadete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredTrips().length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay viajes registrados en este periodo
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Origen</TableHead>
                              <TableHead>Destino</TableHead>
                              <TableHead>Distancia</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTrips().map((trip) => (
                              <TableRow key={trip.id}>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-500" />
                                    <span>{formatDate(trip.created_at)}</span>
                                  </div>
                                </TableCell>
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
                                <TableCell>
                                  {trip.roadDistance ? (trip.roadDistance / 1000).toFixed(2) : "N/A"} km
                                </TableCell>
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
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña de estadísticas diarias */}
              <TabsContent value="daily">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Estadísticas Diarias</CardTitle>
                    <CardDescription>Viajes realizados por día en los últimos 30 días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tripsByDay.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No hay datos disponibles</div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Viajes</TableHead>
                              <TableHead>Distancia (km)</TableHead>
                              <TableHead>Ganancias ($)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tripsByDay.map((day) => (
                              <TableRow key={day.date}>
                                <TableCell>
                                  {new Date(day.date).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </TableCell>
                                <TableCell>{day.totalTrips}</TableCell>
                                <TableCell>{day.totalDistance.toFixed(2)}</TableCell>
                                <TableCell>${day.totalEarnings.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña de estadísticas mensuales */}
              <TabsContent value="monthly">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Estadísticas Mensuales</CardTitle>
                    <CardDescription>Viajes realizados por mes en los últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tripsByMonth.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No hay datos disponibles</div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mes</TableHead>
                              <TableHead>Viajes</TableHead>
                              <TableHead>Distancia (km)</TableHead>
                              <TableHead>Ganancias ($)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tripsByMonth.map((month, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {month.month} {month.year}
                                </TableCell>
                                <TableCell>{month.totalTrips}</TableCell>
                                <TableCell>{month.totalDistance.toFixed(2)}</TableCell>
                                <TableCell>${month.totalEarnings.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

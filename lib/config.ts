// Configuración global de la aplicación
export const appConfig = {
  // Precio base por kilómetro (en pesos)
  pricePerKm: 500,

  // Función para obtener el precio por kilómetro (permite cambios en tiempo real)
  getPricePerKm: () => {
    // Intentar obtener el precio desde localStorage si existe
    const storedPrice = typeof window !== "undefined" ? localStorage.getItem("pricePerKm") : null
    return storedPrice ? Number.parseFloat(storedPrice) : appConfig.pricePerKm
  },

  // Función para establecer un nuevo precio por kilómetro
  setPricePerKm: (newPrice: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pricePerKm", newPrice.toString())
    }
  },

  // Función para verificar si el login con Google está habilitado
  isGoogleLoginEnabled: () => {
    if (typeof window === "undefined") return true
    const setting = localStorage.getItem("googleLoginEnabled")
    return setting === null ? true : setting === "true"
  },

  // Función para establecer si el login con Google está habilitado
  setGoogleLoginEnabled: (enabled: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("googleLoginEnabled", enabled.toString())
    }
  },
}

// Datos de demostración para usuarios
export const demoUsers = [
  {
    id: "demo-user-1",
    user_id: "demo-user-1",
    name: "Juan",
    last_name: "Pérez",
    cadete_id: "CAD-001",
    transport_type: "bicicleta",
    onboarding_completed: true,
    created_at: "2023-01-15T10:30:00Z",
    updated_at: "2023-01-15T10:30:00Z",
    online: true,
    location: { lat: -33.0141, lng: -58.5071 },
    last_active: new Date().toISOString(),
  },
  {
    id: "demo-user-2",
    user_id: "demo-user-2",
    name: "María",
    last_name: "González",
    cadete_id: "CAD-002",
    transport_type: "moto",
    onboarding_completed: true,
    created_at: "2023-02-20T14:45:00Z",
    updated_at: "2023-02-20T14:45:00Z",
    online: true,
    location: { lat: -33.0241, lng: -58.4971 },
    last_active: new Date().toISOString(),
  },
  {
    id: "demo-user-3",
    user_id: "demo-user-3",
    name: "Carlos",
    last_name: "Rodríguez",
    cadete_id: "CAD-003",
    transport_type: "bicicleta",
    onboarding_completed: true,
    created_at: "2023-03-10T09:15:00Z",
    updated_at: "2023-03-10T09:15:00Z",
    online: false,
    location: { lat: -33.0341, lng: -58.4871 },
    last_active: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
  },
  {
    id: "demo-user-4",
    user_id: "demo-user-4",
    name: "Ana",
    last_name: "Martínez",
    cadete_id: "CAD-004",
    transport_type: "moto",
    onboarding_completed: true,
    created_at: "2023-04-05T16:20:00Z",
    updated_at: "2023-04-05T16:20:00Z",
    online: true,
    location: { lat: -33.0441, lng: -58.4771 },
    last_active: new Date().toISOString(),
  },
  {
    id: "demo-user-5",
    user_id: "demo-user-5",
    name: "Luis",
    last_name: "Sánchez",
    cadete_id: "CAD-005",
    transport_type: "bicicleta",
    onboarding_completed: true,
    created_at: "2023-05-12T11:10:00Z",
    updated_at: "2023-05-12T11:10:00Z",
    online: true,
    location: { lat: -33.0541, lng: -58.4671 },
    last_active: new Date().toISOString(),
  },
]

// Datos de demostración para viajes
export const demoTrips = [
  // Usuario 1
  {
    id: Date.now() - 1000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0141, lng: -58.5071 },
    originAddress: "Avenida Sarmiento 230, Gualeguaychú",
    destination: { lat: -33.0241, lng: -58.4971 },
    destinationAddress: "Calle Colón 240, Gualeguaychú",
    roadDistance: 2500,
    price: 1250,
    completed: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // Ayer
  },
  {
    id: Date.now() - 2000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0241, lng: -58.4971 },
    originAddress: "Calle Colón 240, Gualeguaychú",
    destination: { lat: -33.0341, lng: -58.4871 },
    destinationAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    roadDistance: 3200,
    price: 1600,
    completed: true,
    created_at: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
  },

  // Usuario 2
  {
    id: Date.now() - 3000000,
    user_id: "demo-user-2",
    origin: { lat: -33.0341, lng: -58.4871 },
    originAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    destination: { lat: -33.0441, lng: -58.4771 },
    destinationAddress: "Calle Rivadavia 260, Gualeguaychú",
    roadDistance: 1800,
    price: 900,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },

  // Usuario 3
  {
    id: Date.now() - 4000000,
    user_id: "demo-user-3",
    origin: { lat: -33.0441, lng: -58.4771 },
    originAddress: "Calle Rivadavia 260, Gualeguaychú",
    destination: { lat: -33.0541, lng: -58.4671 },
    destinationAddress: "Avenida Mitre 270, Gualeguaychú",
    roadDistance: 4100,
    price: 2050,
    completed: true,
    created_at: new Date(Date.now() - 2592000000).toISOString(), // Hace 30 días
  },

  // Usuario 4 (varios viajes hoy)
  {
    id: Date.now() - 5000000,
    user_id: "demo-user-4",
    origin: { lat: -33.0541, lng: -58.4671 },
    originAddress: "Avenida Mitre 270, Gualeguaychú",
    destination: { lat: -33.0641, lng: -58.4571 },
    destinationAddress: "Luis N Palma 230, Gualeguaychú",
    roadDistance: 2900,
    price: 1450,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },
  {
    id: Date.now() - 6000000,
    user_id: "demo-user-4",
    origin: { lat: -33.0641, lng: -58.4571 },
    originAddress: "Luis N Palma 230, Gualeguaychú",
    destination: { lat: -33.0741, lng: -58.4471 },
    destinationAddress: "Avenida Sarmiento 240, Gualeguaychú",
    roadDistance: 3500,
    price: 1750,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },
  {
    id: Date.now() - 7000000,
    user_id: "demo-user-4",
    origin: { lat: -33.0741, lng: -58.4471 },
    originAddress: "Avenida Sarmiento 240, Gualeguaychú",
    destination: { lat: -33.0841, lng: -58.4371 },
    destinationAddress: "Calle Colón 250, Gualeguaychú",
    roadDistance: 2200,
    price: 1100,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },

  // Más viajes para el usuario 1 (para estadísticas por día/mes)
  {
    id: Date.now() - 8000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0141, lng: -58.5071 },
    originAddress: "Avenida Sarmiento 230, Gualeguaychú",
    destination: { lat: -33.0241, lng: -58.4971 },
    destinationAddress: "Calle Colón 240, Gualeguaychú",
    roadDistance: 2500,
    price: 1250,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },
  {
    id: Date.now() - 9000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0241, lng: -58.4971 },
    originAddress: "Calle Colón 240, Gualeguaychú",
    destination: { lat: -33.0341, lng: -58.4871 },
    destinationAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    roadDistance: 3200,
    price: 1600,
    completed: true,
    created_at: new Date().toISOString(), // Hoy
  },
  {
    id: Date.now() - 10000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0341, lng: -58.4871 },
    originAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    destination: { lat: -33.0441, lng: -58.4771 },
    destinationAddress: "Calle Rivadavia 260, Gualeguaychú",
    roadDistance: 1800,
    price: 900,
    completed: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // Ayer
  },
  {
    id: Date.now() - 11000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0441, lng: -58.4771 },
    originAddress: "Calle Rivadavia 260, Gualeguaychú",
    destination: { lat: -33.0541, lng: -58.4671 },
    destinationAddress: "Avenida Mitre 270, Gualeguaychú",
    roadDistance: 4100,
    price: 2050,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
  },
  {
    id: Date.now() - 12000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0541, lng: -58.4671 },
    originAddress: "Avenida Mitre 270, Gualeguaychú",
    destination: { lat: -33.0641, lng: -58.4571 },
    destinationAddress: "Luis N Palma 230, Gualeguaychú",
    roadDistance: 2900,
    price: 1450,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // Hace 3 días
  },
  {
    id: Date.now() - 13000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0641, lng: -58.4571 },
    originAddress: "Luis N Palma 230, Gualeguaychú",
    destination: { lat: -33.0741, lng: -58.4471 },
    destinationAddress: "Avenida Sarmiento 240, Gualeguaychú",
    roadDistance: 3500,
    price: 1750,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(), // Hace 4 días
  },
  {
    id: Date.now() - 14000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0741, lng: -58.4471 },
    originAddress: "Avenida Sarmiento 240, Gualeguaychú",
    destination: { lat: -33.0841, lng: -58.4371 },
    destinationAddress: "Calle Colón 250, Gualeguaychú",
    roadDistance: 2200,
    price: 1100,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // Hace 5 días
  },
  // Viajes del mes pasado para el usuario 1
  {
    id: Date.now() - 15000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0141, lng: -58.5071 },
    originAddress: "Avenida Sarmiento 230, Gualeguaychú",
    destination: { lat: -33.0241, lng: -58.4971 },
    destinationAddress: "Calle Colón 240, Gualeguaychú",
    roadDistance: 2500,
    price: 1250,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // Hace 30 días
  },
  {
    id: Date.now() - 16000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0241, lng: -58.4971 },
    originAddress: "Calle Colón 240, Gualeguaychú",
    destination: { lat: -33.0341, lng: -58.4871 },
    destinationAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    roadDistance: 3200,
    price: 1600,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 31).toISOString(), // Hace 31 días
  },
  {
    id: Date.now() - 17000000,
    user_id: "demo-user-1",
    origin: { lat: -33.0341, lng: -58.4871 },
    originAddress: "Avenida 9 de Julio 250, Gualeguaychú",
    destination: { lat: -33.0441, lng: -58.4771 },
    destinationAddress: "Calle Rivadavia 260, Gualeguaychú",
    roadDistance: 1800,
    price: 900,
    completed: true,
    created_at: new Date(Date.now() - 86400000 * 32).toISOString(), // Hace 32 días
  },
]

// Función para generar datos de viajes por día para un usuario específico
export const generateTripsByDay = (userId: string, days = 30) => {
  const result = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    // Filtrar viajes para este usuario y este día
    const dayTrips = demoTrips.filter((trip) => {
      const tripDate = new Date(trip.created_at)
      return (
        trip.user_id === userId &&
        tripDate.getDate() === date.getDate() &&
        tripDate.getMonth() === date.getMonth() &&
        tripDate.getFullYear() === date.getFullYear()
      )
    })

    // Calcular estadísticas para este día
    const totalTrips = dayTrips.length
    let totalDistance = 0
    let totalEarnings = 0

    dayTrips.forEach((trip) => {
      if (trip.roadDistance) {
        totalDistance += trip.roadDistance
      } else if (trip.totalDistance) {
        totalDistance += trip.totalDistance
      }

      if (trip.price) {
        totalEarnings += trip.price
      }
    })

    result.push({
      date: date.toISOString().split("T")[0],
      totalTrips,
      totalDistance: totalDistance / 1000, // Convertir a km
      totalEarnings,
    })
  }

  return result
}

// Función para generar datos de viajes por mes para un usuario específico
export const generateTripsByMonth = (userId: string, months = 12) => {
  const result = []
  const today = new Date()

  for (let i = 0; i < months; i++) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)

    // Filtrar viajes para este usuario y este mes
    const monthTrips = demoTrips.filter((trip) => {
      const tripDate = new Date(trip.created_at)
      return (
        trip.user_id === userId &&
        tripDate.getMonth() === date.getMonth() &&
        tripDate.getFullYear() === date.getFullYear()
      )
    })

    // Calcular estadísticas para este mes
    const totalTrips = monthTrips.length
    let totalDistance = 0
    let totalEarnings = 0

    monthTrips.forEach((trip) => {
      if (trip.roadDistance) {
        totalDistance += trip.roadDistance
      } else if (trip.totalDistance) {
        totalDistance += trip.totalDistance
      }

      if (trip.price) {
        totalEarnings += trip.price
      }
    })

    // Nombre del mes en español
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    result.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      totalTrips,
      totalDistance: totalDistance / 1000, // Convertir a km
      totalEarnings,
    })
  }

  return result
}

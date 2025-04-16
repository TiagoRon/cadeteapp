"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  Search,
  Eye,
  Bike,
  BikeIcon as MotorbikeFast,
  UserPlus,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UsersTab({ supabaseConfigured }) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Function to load users directly from database
  const loadUsers = async () => {
    setIsLoading(true)
    try {
      // Get data from Supabase
      const { data, error } = await supabase.from("cadetes").select("*")

      if (error) {
        console.error("Supabase error when loading users:", error)
        throw error
      }

      console.log("Users loaded from Supabase:", data?.length || 0)
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Error loading users from database. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.cadete_id?.toLowerCase().includes(term),
    )

    setFilteredUsers(filtered)
  }, [searchTerm, users])

  // View user details
  const viewUserDetails = (user) => {
    router.push(`/admin/users/${user.id}`)
  }

  // Confirm user deletion
  const confirmDeleteUser = (user) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    setError("")
    setSuccess("")

    try {
      await loadUsers()
      setSuccess("Lista de usuarios actualizada correctamente desde la base de datos")
    } catch (error) {
      setError("Error al actualizar la lista de usuarios desde la base de datos")
    } finally {
      setRefreshing(false)
    }
  }

  // Delete user directly from database
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setDeleteInProgress(true)
    setError("")
    setSuccess("")

    try {
      // Call API to delete user
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: userToDelete.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar usuario de la base de datos")
      }

      // Reload users after deletion
      await loadUsers()

      setSuccess(`Usuario ${userToDelete.name} ${userToDelete.last_name} eliminado correctamente de la base de datos.`)
    } catch (error) {
      console.error("Error deleting user:", error)
      setError(`Error al eliminar usuario de la base de datos: ${error.message || "Intente nuevamente"}`)
    } finally {
      setDeleteInProgress(false)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  // Navigate to user creation page
  const navigateToCreateUser = () => {
    router.push("/admin/users/create")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Gestión de Usuarios en Base de Datos</CardTitle>
            <CardDescription>Administra los usuarios directamente en la base de datos</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar lista de usuarios desde la base de datos"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={navigateToCreateUser}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </div>
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

        {/* Search bar */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o ID de cadete..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Cadete</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No se encontraron usuarios en la base de datos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.cadete_id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.last_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.transport_type === "bicicleta" ? (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                            >
                              <Bike className="h-3 w-3" />
                              Bicicleta
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                            >
                              <MotorbikeFast className="h-3 w-3" />
                              Moto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteUser(user)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar eliminación de la base de datos
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                ¿Estás seguro de que deseas eliminar al usuario{" "}
                <strong>
                  {userToDelete?.name} {userToDelete?.last_name}
                </strong>{" "}
                de la base de datos?
              </div>
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-200">
                <div className="text-sm font-medium">Nota importante:</div>
                <div className="text-xs mt-1">
                  Esta acción eliminará el perfil del cadete de la base de datos. Esta operación no se puede deshacer.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteInProgress}
            >
              {deleteInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando de DB...
                </>
              ) : (
                "Eliminar de Base de Datos"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

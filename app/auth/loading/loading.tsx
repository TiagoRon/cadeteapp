import { Loader2 } from "lucide-react"

export default function AuthLoadingAnimation() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
        <p className="text-lg font-medium text-blue-800 dark:text-blue-300">Preparando tu sesión...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Esto solo tomará un momento</p>
      </div>
    </div>
  )
}

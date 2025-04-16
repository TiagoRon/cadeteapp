import { Suspense } from "react"
import Home from "../home.tsx"
import { LoadingScreen } from "@/components/loading-screen"

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen message="Cargando aplicación..." />}>
      <Home />
    </Suspense>
  )
}
